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
    <div className="p-6 bg-paleGreen rounded-lg shadow-md flex flex-col justify-between">
      
      {itemsPicked === 0 && (
        <div className="mb-4 p-4 border border-yellow-400 bg-yellow-100 text-yellow-800 rounded">
          <h2 className="font-semibold">No data yet...</h2>
          <p className="text-sm">
            Once available, data will show up here!
          </p>
        </div>
      )}

  {itemsPicked === 0 ? (
    <div className="text-center text-gray-700">
      <div className="mb-4 p-4 border border-yellow-400 bg-yellow-100 text-yellow-800 rounded">
          <h2 className="font-semibold">No data yet...</h2>
          <p className="text-sm">
            Once available, data will show up here!
          </p>
        </div>
    </div>
  ) : (

    <div className="flex flex-col justify-between h-full">
      <div>
        <h1 className="text-1xl">Analytics Summary</h1>
      </div>

      <div className="flex flex-row justify-center items-center gap-4">
        <ProgressCircle
          color={"#FEA839"}
          percent={raised / (Number(fundraiser.goalAmount) || 100)}
          amount={raised}
          title={"raised"}
        ></ProgressCircle>
        <ProgressCircle
          color={"#838383"}
          percent={itemsPicked / totalOrders}
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

  )}
    </div>
  );
}
