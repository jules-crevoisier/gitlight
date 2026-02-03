type AuthLayoutProps = {
  children: React.ReactNode
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-muted px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center text-background text-sm font-medium tracking-tighter">
              GL
            </div>
            <span className="font-semibold tracking-tight text-lg text-foreground">GitLight</span>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}

export default AuthLayout
