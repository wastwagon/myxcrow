import { useEffect } from 'react';
import Script from 'next/script';
import { getUser } from '@/lib/auth';

declare global {
  interface Window {
    Intercom: any;
  }
}

export function IntercomChat() {
  const user = getUser();
  const INTERCOM_APP_ID = process.env.NEXT_PUBLIC_INTERCOM_APP_ID;

  useEffect(() => {
    if (!INTERCOM_APP_ID) {
      console.warn('Intercom App ID not configured');
      return;
    }

    if (typeof window !== 'undefined' && window.Intercom) {
      if (user) {
        window.Intercom('boot', {
          app_id: INTERCOM_APP_ID,
          user_id: user.id,
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        });
      } else {
        window.Intercom('boot', {
          app_id: INTERCOM_APP_ID,
        });
      }
    }
  }, [user]);

  if (!INTERCOM_APP_ID) {
    return null;
  }

  return (
    <>
      <Script
        id="intercom-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/${INTERCOM_APP_ID}';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
          `,
        }}
      />
    </>
  );
}
