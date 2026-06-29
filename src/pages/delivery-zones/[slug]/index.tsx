import { GetServerSideProps } from "next";

// Phase 1: the hyperlocal delivery-zone model is replaced by markets.
// Individual zone detail pages no longer exist — redirect to the home page.
const DeliveryZoneDetailPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/",
      permanent: false,
    },
  };
};

export default DeliveryZoneDetailPage;
