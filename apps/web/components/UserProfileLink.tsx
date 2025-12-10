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
      className={`inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors ${className}`}
    >
      <User className="w-4 h-4" />
      <span>{displayName}</span>
    </Link>
  );
}




