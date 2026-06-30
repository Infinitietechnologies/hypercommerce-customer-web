import { GetServerSideProps } from "next";

// Featured-sections endpoint was removed (replaced by the /home-layout builder).
// This page is stubbed to redirect to the products listing so existing links
// and the build keep working until home-layout-driven sections are added.
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
