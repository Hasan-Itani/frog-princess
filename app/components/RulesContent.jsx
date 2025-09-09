import BlueDivider from "./ui/BlueDivider";
import { PartTitle, TinyMuted } from "./ui/SectionText";
import ImgLily from "./ui/ImgLily";
import AwardsGrid from "./AwardsGrid";
import FunctionRow from "./ui/FunctionRow";

export default function RulesContent() {
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden pr-2 custom-scroll w-full">
      <div className="max-w-[520px] mx-auto space-y-5 text-center">
        {/* PLACE YOUR BET */}
        <div className="space-y-2">
          <PartTitle>PLACE YOUR BET</PartTitle>
          <TinyMuted>CHOOSE YOUR BET ON THE COUNTER</TinyMuted>
          <BlueDivider />
        </div>

        {/* SELECT WATER LILY */}
        <div className="space-y-2">
          <PartTitle>SELECT WATER LILY</PartTitle>
          <div className="flex items-center justify-center">
            <ImgLily size={64} />
          </div>
          <TinyMuted>
            CHOOSE A WATER LILY FOR THE NEXT LEVEL TO GET YOUR PRIZE
          </TinyMuted>
          <TinyMuted>BE CAREFUL AND SHUN FALLING</TinyMuted>
          <BlueDivider />
        </div>

        {/* COLLECT PRIZE ANYTIME */}
        <div className="space-y-2">
          <PartTitle>COLLECT PRIZE ANYTIME</PartTitle>
          <div className="flex items-center justify-center">
            <ImgLily size={64} />
          </div>
          <TinyMuted>
            PRESS THE COLLECT BUTTON ANYTIME TO GET THE PRIZE, DISPLAYED ON THE
            FLOWER.
          </TinyMuted>
          <TinyMuted>COMPLETE ALL 14 LEVELS AND WIN x1500</TinyMuted>
          <BlueDivider />
        </div>

        {/* INFORMATION */}
        <div className="space-y-2">
          <PartTitle>INFORMATION</PartTitle>
          <p className="text-sm leading-relaxed text-center">
            Frog Princess is an engaging game where you guide a frog to the end
            of each level while avoiding falling drops. With each level, the
            challenge increases. The bet cannot be changed during a currently
            running game round.
          </p>
          <TinyMuted>
            Please refer to the game rules for more information.
          </TinyMuted>
          <BlueDivider />
        </div>

        {/* HOW TO PLAY? */}
        <div className="space-y-2">
          <PartTitle>HOW TO PLAY?</PartTitle>
          <ul className="text-sm leading-relaxed list-disc list-inside space-y-1 text-center">
            <li>Enter your bet on the counter.</li>
            <li>Choose a water lily for the next level to get your prize.</li>
            <li>
              Press the collect button anytime to get the prize, displayed on
              the flower.
            </li>
          </ul>
          <BlueDivider />
        </div>

        {/* AWARDS */}
        <div className="space-y-2">
          <PartTitle>AWARDS</PartTitle>
          <p className="text-sm text-center">
            The game has 14 levels of water lilies with the following payouts:
            <span className="font-bold"> multiplier × bet</span>.
          </p>
          <AwardsGrid />
          <BlueDivider />
        </div>

        {/* GAME FUNCTIONS */}
        <div className="space-y-3">
          <PartTitle>GAME FUNCTIONS</PartTitle>
          <p className="text-sm opacity-90 text-center">
            The table below lists the different buttons found in the game and
            describes their functions.
          </p>
          <div className="space-y-2">
            <FunctionRow title="Bet" desc="Click + and - to change bet." />
            <FunctionRow title="Sound" desc="Click to mute game sound." />
            <FunctionRow
              title="Menu"
              desc="Click to access the game settings and game information."
            />
          </div>
          <BlueDivider />
        </div>

        {/* ADDITIONAL INFORMATION */}
        <div className="space-y-2">
          <PartTitle>ADDITIONAL INFORMATION</PartTitle>
          <ul className="text-sm leading-relaxed list-disc list-inside space-y-1 text-center">
            <li>The game has a system for recovering unfinished games.</li>
            <li>
              The game session will be ended automatically after an inactivity
              period.
            </li>
            <li>
              In the event of malfunction of the gaming hardware/software, all
              affected game bets and payouts are rendered void and all affected
              bets refunded.
            </li>
          </ul>
          <BlueDivider />
        </div>

        {/* RTP */}
        <div className="space-y-1">
          <PartTitle>RETURN TO PLAYER</PartTitle>
          <p className="text-sm leading-relaxed text-center">
            The theoretical return to the player for this game in the main game
            is <span className="text-orange-400 font-extrabold">96.12%</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
