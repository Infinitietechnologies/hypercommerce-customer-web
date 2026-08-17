import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";

const TemporaryHomeHero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative left-1/2 -mt-px h-64 w-screen max-w-none -translate-x-1/2 overflow-hidden border-0 bg-content1 sm:h-80 min-[1024px]:h-auto">
      <Link
        href="/products/search"
        aria-label={t("home.shop_now")}
        className="block h-full w-full"
      >
        <Image
          priority
          src="/images/home/electronics-hero.png"
          alt=""
          width={3840}
          height={1458}
          sizes="100vw"
          className="h-full w-full object-cover object-left min-[640px]:object-center min-[1024px]:h-auto"
        />
      </Link>
    </section>
  );
};

export default TemporaryHomeHero;
