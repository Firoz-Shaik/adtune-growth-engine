import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type SeoMetaProps = {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  author?: string;
};

const SITE_URL = "https://adtunedigital.in";

const ensureMetaTag = (attr: "name" | "property", key: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  return element;
};

const ensureCanonical = () => {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  return link;
};

export function SeoMeta({ title, description, keywords = [], image, author }: SeoMetaProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = title;

    ensureMetaTag("name", "description").setAttribute("content", description);
    if (keywords.length) {
      ensureMetaTag("name", "keywords").setAttribute("content", keywords.join(", "));
    }
    if (author) {
      ensureMetaTag("name", "author").setAttribute("content", author);
    }
    ensureMetaTag("name", "robots").setAttribute("content", "index, follow");

    const ogImage = image?.startsWith("http") ? image : `${SITE_URL}${image || "/adtune-logo.jpg"}`;
    ensureMetaTag("property", "og:title").setAttribute("content", title);
    ensureMetaTag("property", "og:description").setAttribute("content", description);
    ensureMetaTag("property", "og:type").setAttribute("content", "website");
    ensureMetaTag("property", "og:url").setAttribute("content", `${SITE_URL}${pathname}`);
    ensureMetaTag("property", "og:image").setAttribute("content", ogImage);

    ensureMetaTag("name", "twitter:card").setAttribute("content", "summary_large_image");
    ensureMetaTag("name", "twitter:title").setAttribute("content", title);
    ensureMetaTag("name", "twitter:description").setAttribute("content", description);
    ensureMetaTag("name", "twitter:image").setAttribute("content", ogImage);

    ensureCanonical().setAttribute("href", `${SITE_URL}${pathname}`);

    // Add structured data for LocalBusiness (commented out until added to Google My Business)
    /*
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "AdTune Digital",
      "description": description,
      "url": SITE_URL,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Hyderabad",
        "addressCountry": "IN"
      },
      "telephone": "+91 86886 54432",
      "email": "contact@adtunedigital.in",
      "sameAs": [
        "https://www.linkedin.com/company/adtune-digital"
      ]
    };

    let script = document.head.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
    */
  }, [description, keywords, pathname, title, image, author]);

  return null;
}
