import Script from "next/script";
import { COOKIE_CONSENT_STORAGE_KEY } from "@/lib/cookie-consent";
import { resolveMetaPixelId } from "@/lib/meta-pixel-config";

export type MetaPixelProps = {
  /** From admin `metaAds` setting or `NEXT_PUBLIC_META_PIXEL_ID`. */
  pixelId?: string | null;
};

/**
 * Meta Pixel with consent mode: revoke before init when analytics not accepted; grant only after user accepts (via banner).
 */
export function MetaPixel({ pixelId }: MetaPixelProps) {
  const resolved = resolveMetaPixelId(pixelId, process.env.NEXT_PUBLIC_META_PIXEL_ID);

  const idLiteral = JSON.stringify(resolved);
  const key = COOKIE_CONSENT_STORAGE_KEY;

  const bootstrap = `
(function(){
  var allow = false;
  try {
    allow = window.localStorage.getItem(${JSON.stringify(key)}) === "analytics_accepted";
  } catch (e) {}
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  if (!allow) { fbq('consent', 'revoke'); }
  fbq('init', ${idLiteral});
  fbq('track', 'PageView');
})();
`;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: bootstrap }} />
      {/* Renders only when JS is disabled, so consent mode cannot gate it (matches Meta's official snippet). */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${encodeURIComponent(resolved)}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
