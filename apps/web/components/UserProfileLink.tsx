import Link from 'next/link';
import { User } from 'lucide-react';

interface UserProfileLinkProps {
  userId: string;
  name?: string;
  email?: string;
  className?: string;
}

export default function UserProfileLink({ userId, name, email, className = '' }: UserProfileLinkProps) {
  const displayName = name || email || 'User';

  return (
    <Link
      href={`/profile/${userId}`}
      className={`inline-flex items-center gap-1 text-brand-gold hover:text-brand-gold/80 hover:underline transition-colors ${className}`}
    >
      <User className="w-4 h-4 shrink-0" />
      <span>{displayName}</span>
    </Link>
  );
}
