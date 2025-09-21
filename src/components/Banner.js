// Only an image banner with mobile/tablet/desktop variants
export default function Banner() {
  return (
    <section aria-label="DanceVerse banner">
      <picture>
        {/* High-efficiency formats first (optional but recommended) */}
        <source
          type="image/avif"
          media="(min-width: 1024px)"
          srcSet="/banners/banner-desktop.avif"
        />
        <source
          type="image/avif"
          media="(min-width: 640px)"
          srcSet="/banners/banner-tablet.avif"
        />
        <source
          type="image/avif"
          srcSet="/banners/banner-mobile.avif"
        />

        {/* WebP fallbacks */}
        <source
          type="image/webp"
          media="(min-width: 1024px)"
          srcSet="/banners/banner-desktop.webp"
        />
        <source
          type="image/webp"
          media="(min-width: 640px)"
          srcSet="/banners/banner-tablet.webp"
        />
        <source
          type="image/webp"
          srcSet="/banners/banner-mobile.webp"
        />

        {/* Final fallback (JPEG/PNG) */}
        <img
          src="/banners/banner-mobile.jpg"
          alt="DanceVerse — join the digital dance show"
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </picture>
    </section>
  );
}
