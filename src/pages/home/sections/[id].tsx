import { GetServerSideProps } from "next";

import HomeSectionDetailView, {
  HomeSectionDetailData,
} from "@/views/homePage/HomeSectionDetailView";
import { getHomeLayoutSection } from "@/routes/api";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import { HomeSectionType } from "@/types/ApiResponse";
import { loadTranslations } from "../../../../i18n";

const HomeSectionDetailPage = ({ data }: { data: HomeSectionDetailData }) => (
  <HomeSectionDetailView data={data} />
);

export const getServerSideProps: GetServerSideProps = async (context) => {
  await loadTranslations(context);

  const sectionId = Number(context.params?.id);
  const type = (context.query.type as string) || "products";
  const style = (context.query.style as string) || "";
  const title = (context.query.title as string) || "";
  const market = getMarketFromContext(context);

  let items: HomeSectionDetailData["items"] = [];
  let currentPage = 1;
  let lastPage = 1;

  if (Number.isFinite(sectionId)) {
    const res = await getHomeLayoutSection({ sectionId, page: 1, per_page: 20, market });
    if (res.success && res.data) {
      items = (res.data.data as unknown as HomeSectionDetailData["items"]) ?? [];
      currentPage = res.data.current_page ?? 1;
      lastPage = res.data.last_page ?? 1;
    }
  }

  const data: HomeSectionDetailData = {
    sectionId,
    type: type as HomeSectionType,
    style,
    title,
    items,
    currentPage,
    lastPage,
  };

  return { props: { data } };
};

export default HomeSectionDetailPage;
