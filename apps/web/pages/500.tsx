import { ButtonLink } from '@/components/ui/Button';
import { Home } from 'lucide-react';
import PublicPage from '@/components/PublicPage';

export default function ServerError() {
  return (
    <PublicPage
      title="500"
      subtitle="Server error"
      documentTitle="Server error - MYXCROW"
      description="Something went wrong on our end. Please try again in a moment."
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
