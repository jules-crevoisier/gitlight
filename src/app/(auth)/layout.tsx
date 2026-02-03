type AuthLayoutProps = {
  children: React.ReactNode
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center text-white dark:text-zinc-900 text-sm font-medium tracking-tighter">
              GL
            </div>
            <span className="font-semibold tracking-tight text-lg text-zinc-900 dark:text-zinc-100">GitLight</span>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}

export default AuthLayout
