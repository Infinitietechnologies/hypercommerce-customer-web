import ProductPage, {
  getServerSideProps as productPageServerSideProps,
} from "@/pages/products/[slug]/index";

/**
 * The share landing renders the product page. It reuses that page's own server
 * logic rather than keeping a second copy — the duplicate had already drifted
 * (no notFound guard for a removed product; no country_iso2).
 */
export const getServerSideProps = productPageServerSideProps;

export default ProductPage;
