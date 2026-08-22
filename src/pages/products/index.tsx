import { useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

const ProductsIndexPage = () => {
  const router = useRouter();

  useEffect(() => {
    void router.replace("/products/search/");
  }, [router]);

  return (
    <Head>
      <meta httpEquiv="refresh" content="0;url=/products/search/" />
      <meta name="robots" content="noindex,follow" />
      <link rel="canonical" href="/products/search/" />
    </Head>
  );
};

export default ProductsIndexPage;
