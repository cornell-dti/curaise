import { z } from "zod";
import { BasicFundraiserSchema } from "common";
import ProgressCircle from "./ProgressCircle";
import { SeeMoreLink } from "./SeeMoreLink";
export function AnalyticsSummaryCard({
  fundraiser,
  raised,
  itemsPicked,
  totalOrders,
  profit,
}: {
  fundraiser: z.infer<typeof BasicFundraiserSchema>;
  raised: number;
  itemsPicked: number;
  totalOrders: number;
  profit: number;
}) {
  return (
    <div>
    <div className="relative p-6 bg-paleGreen rounded-lg shadow-md flex flex-col justify-between">

    <div className={`flex flex-col justify-between h-full ${totalOrders === 0 ? "opacity-50" : "opacity-100"}`}>
      <div>
        <h1 className="text-1xl">Analytics Summary</h1>
      </div>

      <div className="flex flex-row justify-center items-center gap-4">
        <ProgressCircle
          color={"#FEA839"}
          percent={!isNaN(Number(fundraiser.goalAmount)) && Number(fundraiser.goalAmount) > 0
            ? raised / Number(fundraiser.goalAmount)
            : 0}
          amount={raised}
          title={"raised"}
        ></ProgressCircle>
        <ProgressCircle
          color={"#838383"}
          percent={!isNaN(itemsPicked) && itemsPicked > 0
            ? itemsPicked / totalOrders
            : 0}
          amount={itemsPicked}
          title={"items picked"}
        ></ProgressCircle>
        <ProgressCircle
          color={"#138808"}
          percent={0.72}
          amount={profit}
          title="profit"
        ></ProgressCircle>
      </div>

      <SeeMoreLink path="analytics"></SeeMoreLink>
    </div>

    {itemsPicked === 0 && (
        <div className="absolute ml-[15%] mt-[10%] md:ml-[25%] text-center p-4 border bg-gray-100 shadow-md rounded-lg">
          <h2 className="font-semibold text-xl">No data yet...</h2>
          <p className="text-sm mt-2">
            Once available, data will show up here!
          </p>
        </div>
      )}
    </div>
    </div>
  );
}
