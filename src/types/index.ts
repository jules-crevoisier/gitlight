export type TreeEntry = {
  mode: string
  type: 'blob' | 'tree'
  hash: string
  name: string
  path: string
  size?: number
}

export type CommitInfo = {
  hash: string
  message: string
  author: {
    name: string
    email: string
  }
  date: Date
  parents: string[]
}

export type BranchInfo = {
  name: string
  commit: string
  isDefault: boolean
  isCurrent: boolean
}

export type DiffFile = {
  path: string
  oldPath?: string
  status: 'added' | 'deleted' | 'modified' | 'renamed'
  additions: number
  deletions: number
  hunks: DiffHunk[]
}

export type DiffHunk = {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: DiffLine[]
}

export type DiffLine = {
  type: 'context' | 'addition' | 'deletion'
  content: string
  oldNumber?: number
  newNumber?: number
}

export type RepoStats = {
  commits: number
  branches: number
  tags: number
  contributors: number
}

export type FileContent = {
  content: string
  encoding: 'utf-8' | 'base64'
  size: number
  isBinary: boolean
}

export type UserSession = {
  id: string
  username: string
  email: string
}
