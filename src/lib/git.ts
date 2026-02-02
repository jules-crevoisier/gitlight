import simpleGit, { SimpleGit, LogResult } from 'simple-git'
import { execSync, exec } from 'child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'fs'
import path from 'path'
import type { TreeEntry, CommitInfo, BranchInfo, DiffFile, FileContent } from '@/types'

const REPOS_PATH = process.env.REPOS_PATH || path.join(process.cwd(), 'repositories')

export const getRepoPath = (owner: string, repo: string): string => {
  return path.resolve(REPOS_PATH, owner, `${repo}.git`)
}

export const repoExists = (owner: string, repo: string): boolean => {
  const repoPath = getRepoPath(owner, repo)
  return existsSync(repoPath) && existsSync(path.join(repoPath, 'HEAD'))
}

export const createBareRepo = async (owner: string, name: string): Promise<void> => {
  const ownerPath = path.resolve(REPOS_PATH, owner)
  const repoPath = getRepoPath(owner, name)

  // Create owner directory if it doesn't exist
  if (!existsSync(ownerPath)) {
    mkdirSync(ownerPath, { recursive: true })
  }

  // Initialize bare repository using git command directly for Windows compatibility
  try {
    execSync(`git init --bare --initial-branch=main "${repoPath}"`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    })
  } catch (error) {
    console.error('Git init failed:', error)
    throw error
  }

  // Set up default config
  const configPath = path.join(repoPath, 'config')
  const config = readFileSync(configPath, 'utf-8')
  const updatedConfig = config + `
[receive]
    denyCurrentBranch = updateInstead
    denyDeleteCurrent = warn
[http]
    receivepack = true
`
  writeFileSync(configPath, updatedConfig)

  // Create description file
  writeFileSync(path.join(repoPath, 'description'), `${name} repository`)

  // Set up hooks directory
  const hooksDir = path.join(repoPath, 'hooks')
  if (!existsSync(hooksDir)) {
    mkdirSync(hooksDir, { recursive: true })
  }

  // Create post-receive hook
  const postReceiveHook = `#!/bin/sh
# GitLight post-receive hook
# This hook is called after a successful push

while read oldrev newrev refname
do
    echo "Ref $refname updated from $oldrev to $newrev"
done
`
  const hookPath = path.join(hooksDir, 'post-receive')
  writeFileSync(hookPath, postReceiveHook)
  
  // Make hook executable on Unix systems
  try {
    chmodSync(hookPath, '755')
  } catch {
    // Windows doesn't support chmod
  }
}

export const deleteRepo = async (owner: string, name: string): Promise<void> => {
  const repoPath = getRepoPath(owner, name)
  if (existsSync(repoPath)) {
    const { rmSync } = await import('fs')
    rmSync(repoPath, { recursive: true, force: true })
  }
}

export const getGit = (owner: string, repo: string): SimpleGit => {
  const repoPath = getRepoPath(owner, repo)
  return simpleGit(repoPath)
}

export const getBranches = async (owner: string, repo: string): Promise<BranchInfo[]> => {
  const git = getGit(owner, repo)
  
  try {
    const result = await git.branch(['-a'])
    const defaultBranch = result.current || 'main'
    
    return Object.entries(result.branches).map(([name, data]) => ({
      name: name.replace('remotes/origin/', ''),
      commit: data.commit,
      isDefault: name === defaultBranch,
      isCurrent: data.current,
    }))
  } catch {
    return []
  }
}

export const getDefaultBranch = async (owner: string, repo: string): Promise<string> => {
  const repoPath = getRepoPath(owner, repo)
  
  try {
    // First try to get the HEAD reference
    const head = readFileSync(path.join(repoPath, 'HEAD'), 'utf-8').trim()
    const match = head.match(/ref: refs\/heads\/(.+)/)
    const headBranch = match ? match[1] : null

    // Check if the HEAD branch has commits
    if (headBranch) {
      try {
        execSync(`git -C "${repoPath}" rev-parse --verify ${headBranch}`, { encoding: 'utf-8', stdio: 'pipe' })
        return headBranch
      } catch {
        // HEAD branch has no commits, find an actual branch with commits
      }
    }

    // Get all branches and find one with commits
    const branchesResult = execSync(`git -C "${repoPath}" branch`, { encoding: 'utf-8', stdio: 'pipe' })
    const branches = branchesResult.trim().split('\n').map(b => b.trim().replace('* ', '')).filter(Boolean)
    
    // Return the first branch that exists, prioritizing main/master
    const priorityBranches = ['main', 'master', ...branches]
    for (const branch of priorityBranches) {
      try {
        execSync(`git -C "${repoPath}" rev-parse --verify ${branch}`, { encoding: 'utf-8', stdio: 'pipe' })
        return branch
      } catch {
        continue
      }
    }

    return 'main'
  } catch {
    return 'main'
  }
}

export const getCommits = async (
  owner: string,
  repo: string,
  ref: string = 'HEAD',
  limit: number = 50
): Promise<CommitInfo[]> => {
  const git = getGit(owner, repo)

  try {
    const log: LogResult = await git.log({
      maxCount: limit,
      [ref]: null,
    } as any)

    return log.all.map((commit) => ({
      hash: commit.hash,
      message: commit.message,
      author: {
        name: commit.author_name,
        email: commit.author_email,
      },
      date: new Date(commit.date),
      parents: commit.refs ? commit.refs.split(', ') : [],
    }))
  } catch {
    return []
  }
}

export const getCommit = async (
  owner: string,
  repo: string,
  sha: string
): Promise<CommitInfo | null> => {
  const git = getGit(owner, repo)

  try {
    const log = await git.log({
      maxCount: 1,
      [sha]: null,
    } as any)

    const commit = log.latest
    if (!commit) return null

    return {
      hash: commit.hash,
      message: commit.message,
      author: {
        name: commit.author_name,
        email: commit.author_email,
      },
      date: new Date(commit.date),
      parents: [],
    }
  } catch {
    return null
  }
}

export const getTree = async (
  owner: string,
  repo: string,
  ref: string,
  treePath: string = ''
): Promise<TreeEntry[]> => {
  const repoPath = getRepoPath(owner, repo)

  try {
    const normalizedPath = treePath ? treePath.replace(/^\/+|\/+$/g, '') : ''
    const lsTreePath = normalizedPath || '.'
    
    const result = execSync(
      `git -C "${repoPath}" ls-tree ${ref} ${lsTreePath === '.' ? '' : `"${lsTreePath}/"`}`,
      { encoding: 'utf-8' }
    )

    if (!result.trim()) {
      return []
    }

    const entries: TreeEntry[] = result
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(\d+)\s+(\w+)\s+([a-f0-9]+)\s+(.+)$/)
        if (!match) return null

        const [, mode, type, hash, name] = match
        const entryName = name.split('/').pop() || name

        return {
          mode,
          type: type as 'blob' | 'tree',
          hash,
          name: entryName,
          path: normalizedPath ? `${normalizedPath}/${entryName}` : entryName,
        }
      })
      .filter((entry): entry is TreeEntry => entry !== null)

    // Sort: folders first, then files, alphabetically
    return entries.sort((a, b) => {
      if (a.type === 'tree' && b.type !== 'tree') return -1
      if (a.type !== 'tree' && b.type === 'tree') return 1
      return a.name.localeCompare(b.name)
    })
  } catch {
    return []
  }
}

export const getFileContent = async (
  owner: string,
  repo: string,
  ref: string,
  filePath: string
): Promise<FileContent | null> => {
  const repoPath = getRepoPath(owner, repo)

  try {
    const result = execSync(
      `git -C "${repoPath}" show ${ref}:"${filePath}"`,
      { encoding: 'buffer', maxBuffer: 10 * 1024 * 1024 }
    )

    // Check if binary
    const isBinary = result.includes(0)
    
    if (isBinary) {
      return {
        content: result.toString('base64'),
        encoding: 'base64',
        size: result.length,
        isBinary: true,
      }
    }

    return {
      content: result.toString('utf-8'),
      encoding: 'utf-8',
      size: result.length,
      isBinary: false,
    }
  } catch {
    return null
  }
}

export const getLastCommitForPath = async (
  owner: string,
  repo: string,
  ref: string,
  filePath: string
): Promise<CommitInfo | null> => {
  const git = getGit(owner, repo)

  try {
    const log = await git.log({
      maxCount: 1,
      file: filePath,
      [ref]: null,
    } as any)

    const commit = log.latest
    if (!commit) return null

    return {
      hash: commit.hash,
      message: commit.message,
      author: {
        name: commit.author_name,
        email: commit.author_email,
      },
      date: new Date(commit.date),
      parents: [],
    }
  } catch {
    return null
  }
}

export const getDiff = async (
  owner: string,
  repo: string,
  base: string,
  head: string
): Promise<DiffFile[]> => {
  const repoPath = getRepoPath(owner, repo)

  try {
    const result = execSync(
      `git -C "${repoPath}" diff --numstat ${base}...${head}`,
      { encoding: 'utf-8' }
    )

    if (!result.trim()) return []

    return result
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const parts = line.split('\t')
        const additions = parseInt(parts[0]) || 0
        const deletions = parseInt(parts[1]) || 0
        const filePath = parts[2]

        return {
          path: filePath,
          status: 'modified' as const,
          additions,
          deletions,
          hunks: [],
        }
      })
  } catch {
    return []
  }
}

export const canMerge = async (
  owner: string,
  repo: string,
  source: string,
  target: string
): Promise<boolean> => {
  const repoPath = getRepoPath(owner, repo)

  try {
    execSync(
      `git -C "${repoPath}" merge-base --is-ancestor ${target} ${source} 2>/dev/null || git -C "${repoPath}" merge-tree $(git -C "${repoPath}" merge-base ${target} ${source}) ${target} ${source}`,
      { encoding: 'utf-8' }
    )
    return true
  } catch {
    return false
  }
}

export const getFileDiff = async (
  owner: string,
  repo: string,
  base: string,
  head: string,
  filePath: string
): Promise<string> => {
  const repoPath = getRepoPath(owner, repo)

  try {
    const result = execSync(
      `git -C "${repoPath}" diff ${base}...${head} -- "${filePath}"`,
      { encoding: 'utf-8', maxBuffer: 5 * 1024 * 1024 }
    )
    return result
  } catch {
    return ''
  }
}

export const getBlame = async (
  owner: string,
  repo: string,
  ref: string,
  filePath: string
): Promise<Array<{ commit: string; author: string; date: string; line: string }>> => {
  const repoPath = getRepoPath(owner, repo)

  try {
    const result = execSync(
      `git -C "${repoPath}" blame --line-porcelain ${ref} -- "${filePath}"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    )

    const lines: Array<{ commit: string; author: string; date: string; line: string }> = []
    const chunks = result.split('\n')
    
    let currentCommit = ''
    let currentAuthor = ''
    let currentDate = ''

    for (const chunk of chunks) {
      if (chunk.match(/^[a-f0-9]{40}/)) {
        currentCommit = chunk.substring(0, 40)
      } else if (chunk.startsWith('author ')) {
        currentAuthor = chunk.substring(7)
      } else if (chunk.startsWith('author-time ')) {
        currentDate = new Date(parseInt(chunk.substring(12)) * 1000).toISOString()
      } else if (chunk.startsWith('\t')) {
        lines.push({
          commit: currentCommit,
          author: currentAuthor,
          date: currentDate,
          line: chunk.substring(1),
        })
      }
    }

    return lines
  } catch {
    return []
  }
}

export const getTags = async (owner: string, repo: string): Promise<string[]> => {
  const repoPath = getRepoPath(owner, repo)

  try {
    const result = execSync(
      `git -C "${repoPath}" tag -l --sort=-creatordate`,
      { encoding: 'utf-8' }
    )
    return result.trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
}

export const createTag = async (
  owner: string,
  repo: string,
  tagName: string,
  ref: string,
  message?: string
): Promise<boolean> => {
  const repoPath = getRepoPath(owner, repo)

  try {
    if (message) {
      execSync(
        `git -C "${repoPath}" tag -a "${tagName}" ${ref} -m "${message}"`,
        { encoding: 'utf-8' }
      )
    } else {
      execSync(
        `git -C "${repoPath}" tag "${tagName}" ${ref}`,
        { encoding: 'utf-8' }
      )
    }
    return true
  } catch {
    return false
  }
}

export const deleteTag = async (owner: string, repo: string, tagName: string): Promise<boolean> => {
  const repoPath = getRepoPath(owner, repo)

  try {
    execSync(`git -C "${repoPath}" tag -d "${tagName}"`, { encoding: 'utf-8' })
    return true
  } catch {
    return false
  }
}

export const createBranch = async (
  owner: string,
  repo: string,
  branchName: string,
  fromRef: string
): Promise<boolean> => {
  const repoPath = getRepoPath(owner, repo)

  try {
    execSync(
      `git -C "${repoPath}" branch "${branchName}" ${fromRef}`,
      { encoding: 'utf-8' }
    )
    return true
  } catch {
    return false
  }
}

export const deleteBranch = async (
  owner: string,
  repo: string,
  branchName: string
): Promise<boolean> => {
  const repoPath = getRepoPath(owner, repo)

  try {
    execSync(
      `git -C "${repoPath}" branch -D "${branchName}"`,
      { encoding: 'utf-8' }
    )
    return true
  } catch {
    return false
  }
}

export const mergeBranches = async (
  owner: string,
  repo: string,
  source: string,
  target: string,
  message: string
): Promise<{ success: boolean; error?: string; commitSha?: string }> => {
  const repoPath = getRepoPath(owner, repo)

  try {
    // Get source commit
    const sourceCommit = execSync(
      `git -C "${repoPath}" rev-parse ${source}`,
      { encoding: 'utf-8', stdio: 'pipe' }
    ).trim()

    // Check if target branch exists
    let targetCommit: string
    let targetExists = true
    
    try {
      targetCommit = execSync(
        `git -C "${repoPath}" rev-parse ${target}`,
        { encoding: 'utf-8', stdio: 'pipe' }
      ).trim()
    } catch {
      // Target branch doesn't exist, just create it pointing to source
      targetExists = false
      targetCommit = ''
    }

    if (!targetExists) {
      // Create target branch pointing to source commit
      execSync(
        `git -C "${repoPath}" update-ref refs/heads/${target} ${sourceCommit}`,
        { encoding: 'utf-8' }
      )
      return { success: true, commitSha: sourceCommit }
    }

    // Check if fast-forward is possible
    const mergeBase = execSync(
      `git -C "${repoPath}" merge-base ${target} ${source}`,
      { encoding: 'utf-8', stdio: 'pipe' }
    ).trim()

    if (mergeBase === targetCommit) {
      // Fast-forward is possible - just update the ref
      execSync(
        `git -C "${repoPath}" update-ref refs/heads/${target} ${sourceCommit}`,
        { encoding: 'utf-8' }
      )
      return { success: true, commitSha: sourceCommit }
    }

    // Check if source is already merged into target
    if (mergeBase === sourceCommit) {
      return { success: false, error: 'Source branch is already merged into target' }
    }

    // Non-fast-forward merge - use read-tree and commit-tree
    // This requires creating a merge commit
    try {
      // Get the tree resulting from the merge using merge-tree
      const mergeResult = execSync(
        `git -C "${repoPath}" merge-tree ${mergeBase} ${targetCommit} ${sourceCommit}`,
        { encoding: 'utf-8', stdio: 'pipe', maxBuffer: 10 * 1024 * 1024 }
      )

      // Check for conflict markers
      if (mergeResult.includes('<<<<<<<') || mergeResult.includes('>>>>>>>') || mergeResult.includes('=======')) {
        return { success: false, error: 'Merge conflict detected - please resolve manually' }
      }

      // Get the tree from source commit (for simple merge without conflicts)
      const sourceTree = execSync(
        `git -C "${repoPath}" rev-parse ${sourceCommit}^{tree}`,
        { encoding: 'utf-8', stdio: 'pipe' }
      ).trim()

      // Create a merge commit with two parents
      const mergeCommit = execSync(
        `git -C "${repoPath}" commit-tree ${sourceTree} -p ${targetCommit} -p ${sourceCommit} -m "${message.replace(/"/g, '\\"')}"`,
        { encoding: 'utf-8', stdio: 'pipe' }
      ).trim()

      // Update target branch
      execSync(
        `git -C "${repoPath}" update-ref refs/heads/${target} ${mergeCommit}`,
        { encoding: 'utf-8' }
      )

      return { success: true, commitSha: mergeCommit }
    } catch (mergeError) {
      console.error('Non-fast-forward merge error:', mergeError)
      return { success: false, error: 'Merge failed - conflicts may exist' }
    }
  } catch (error) {
    console.error('mergeBranches error:', error)
    return { success: false, error: (error as Error).message }
  }
}

export const getCommitCount = async (owner: string, repo: string, ref: string = 'HEAD'): Promise<number> => {
  const repoPath = getRepoPath(owner, repo)

  try {
    const result = execSync(
      `git -C "${repoPath}" rev-list --count ${ref}`,
      { encoding: 'utf-8' }
    )
    return parseInt(result.trim()) || 0
  } catch {
    return 0
  }
}

export const getContributors = async (
  owner: string,
  repo: string
): Promise<Array<{ name: string; email: string; commits: number }>> => {
  const repoPath = getRepoPath(owner, repo)

  try {
    const result = execSync(
      `git -C "${repoPath}" shortlog -sne HEAD`,
      { encoding: 'utf-8' }
    )

    return result
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^\s*(\d+)\s+(.+)\s+<(.+)>$/)
        if (!match) return null
        return {
          commits: parseInt(match[1]),
          name: match[2].trim(),
          email: match[3],
        }
      })
      .filter((c): c is { name: string; email: string; commits: number } => c !== null)
  } catch {
    return []
  }
}

export const getRepoStats = async (owner: string, repo: string) => {
  const [commits, branches, tags, contributors] = await Promise.all([
    getCommitCount(owner, repo),
    getBranches(owner, repo),
    getTags(owner, repo),
    getContributors(owner, repo),
  ])

  return {
    commits,
    branches: branches.length,
    tags: tags.length,
    contributors: contributors.length,
  }
}

export const searchCode = async (
  owner: string,
  repo: string,
  query: string,
  ref: string = 'HEAD'
): Promise<Array<{ file: string; line: number; content: string }>> => {
  const repoPath = getRepoPath(owner, repo)

  try {
    const result = execSync(
      `git -C "${repoPath}" grep -n "${query}" ${ref}`,
      { encoding: 'utf-8', maxBuffer: 5 * 1024 * 1024 }
    )

    return result
      .trim()
      .split('\n')
      .filter(Boolean)
      .slice(0, 100) // Limit results
      .map((line) => {
        const match = line.match(/^[^:]+:([^:]+):(\d+):(.*)$/)
        if (!match) return null
        return {
          file: match[1],
          line: parseInt(match[2]),
          content: match[3],
        }
      })
      .filter((r): r is { file: string; line: number; content: string } => r !== null)
  } catch {
    return []
  }
}

export const getCommitsBetween = async (
  owner: string,
  repo: string,
  base: string,
  head: string
): Promise<CommitInfo[]> => {
  const git = getGit(owner, repo)

  try {
    const log = await git.log({
      from: base,
      to: head,
    })

    return log.all.map((commit) => ({
      hash: commit.hash,
      message: commit.message,
      author: {
        name: commit.author_name,
        email: commit.author_email,
      },
      date: new Date(commit.date),
      parents: [],
    }))
  } catch {
    return []
  }
}

export const getCommitDiff = async (
  owner: string,
  repo: string,
  sha: string
): Promise<DiffFile[]> => {
  const repoPath = getRepoPath(owner, repo)

  try {
    // Get parent commit using rev-list instead of ^ notation (Windows compatible)
    let parentSha: string | null = null
    
    try {
      const parents = execSync(
        `git -C "${repoPath}" rev-list --parents -n 1 ${sha}`,
        { encoding: 'utf-8', stdio: 'pipe' }
      ).trim().split(' ')
      
      // First element is the commit itself, rest are parents
      if (parents.length > 1) {
        parentSha = parents[1]
      }
    } catch {
      // No parents - initial commit
    }

    let diffCommand: string
    if (parentSha) {
      diffCommand = `git -C "${repoPath}" diff --numstat ${parentSha} ${sha}`
    } else {
      // Initial commit - diff against empty tree
      diffCommand = `git -C "${repoPath}" diff --numstat 4b825dc642cb6eb9a060e54bf8d69288fbee4904 ${sha}`
    }

    const result = execSync(diffCommand, { encoding: 'utf-8', maxBuffer: 5 * 1024 * 1024 })

    if (!result.trim()) return []

    return result
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const parts = line.split('\t')
        const additions = parts[0] === '-' ? 0 : parseInt(parts[0]) || 0
        const deletions = parts[1] === '-' ? 0 : parseInt(parts[1]) || 0
        const filePath = parts[2]

        return {
          path: filePath,
          status: 'modified' as const,
          additions,
          deletions,
          hunks: [],
        }
      })
  } catch (error) {
    console.error('getCommitDiff error:', error)
    return []
  }
}

export const getCommitFileDiff = async (
  owner: string,
  repo: string,
  sha: string,
  filePath: string
): Promise<string> => {
  const repoPath = getRepoPath(owner, repo)

  try {
    // Get parent commit using rev-list (Windows compatible)
    let parentSha: string | null = null
    
    try {
      const parents = execSync(
        `git -C "${repoPath}" rev-list --parents -n 1 ${sha}`,
        { encoding: 'utf-8', stdio: 'pipe' }
      ).trim().split(' ')
      
      if (parents.length > 1) {
        parentSha = parents[1]
      }
    } catch {
      // No parents - initial commit
    }

    let diffCommand: string
    if (parentSha) {
      diffCommand = `git -C "${repoPath}" diff ${parentSha} ${sha} -- "${filePath}"`
    } else {
      // Initial commit - diff against empty tree
      diffCommand = `git -C "${repoPath}" diff 4b825dc642cb6eb9a060e54bf8d69288fbee4904 ${sha} -- "${filePath}"`
    }

    return execSync(diffCommand, { encoding: 'utf-8', maxBuffer: 5 * 1024 * 1024 })
  } catch (error) {
    console.error('getCommitFileDiff error:', error)
    return ''
  }
}
