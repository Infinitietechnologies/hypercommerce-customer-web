import { GetServerSideProps } from "next";

// Phase 1: the hyperlocal delivery-zone model is replaced by markets.
// There is no zone listing anymore — redirect to the home page.
const DeliveryZonesPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/",
      permanent: false,
    },
  };
};

export default DeliveryZonesPage;
