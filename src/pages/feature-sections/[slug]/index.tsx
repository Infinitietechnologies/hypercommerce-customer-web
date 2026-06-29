import { GetServerSideProps } from "next";

// Phase 1: feature-section detail pages are NOT migrated to the hypercommerce
// home-layout model yet. Redirect to the products catalogue so the build stays
// green and users still land somewhere useful.
const FeatureSectionPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/products",
      permanent: false,
    },
  };
};

export default FeatureSectionPage;
