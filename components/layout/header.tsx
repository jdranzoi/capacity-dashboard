import { createAuthClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { SyncStatus } from './sync-status'
import { SignOutButton } from './sign-out-button'
import { ThemeToggle } from './theme-toggle'

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  leadership: 'Leadership',
  account_manager: 'Account Manager',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export async function Header() {
  const supabase = await createAuthClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'User'
  const role = (user?.app_metadata?.role as string | undefined) ?? ''
  const roleLabel = roleLabels[role] ?? role

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-sm">
      <SyncStatus />
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {roleLabel && (
          <Badge variant="secondary" className="text-xs font-medium">
            {roleLabel}
          </Badge>
        )}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px]">{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{displayName}</span>
        </div>
        <SignOutButton />
      </div>
    </header>
  )
}
