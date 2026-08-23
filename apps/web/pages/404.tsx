import { ButtonLink } from '@/components/ui/Button';
import { Home } from 'lucide-react';
import PublicPage from '@/components/PublicPage';

export default function NotFound() {
  return (
    <PublicPage
      title="404"
      subtitle="Page not found"
      documentTitle="Page not found - MYXCROW"
      description="The page you're looking for doesn't exist or has been moved."
      noIndex
      centered
      card={false}
      maxWidthClass="max-w-md"
    >
      <ButtonLink href="/" variant="maroon" className="mt-8">
        <Home className="w-5 h-5" />
        Go to Home
      </ButtonLink>
    </PublicPage>
  );
}
