// Strategy guide content. Body is trusted static HTML authored here.
export const GUIDES = [
  {
    id: 'tokens',
    icon: '🪙',
    title: 'Token economy — spend like a top manager',
    summary: 'Tokens are the scarcest resource in the game. Where they go decides how fast you grow.',
    body: `
      <h4>Golden rules</h4>
      <ul>
        <li><strong>Players first.</strong> The best token-per-value spend is almost always young fast trainers in the auction market. A great squad wins trophies; nothing else does.</li>
        <li><strong>Never buy condition with tokens.</strong> Rest packs regenerate and drop from videos, competitions and Associations. Paying tokens for greens is the classic new-manager leak.</li>
        <li><strong>Don't panic-buy mid-season.</strong> Prices are highest when everyone is competing. The cheapest window is early season (day 1–3) when the market floods with newly generated players.</li>
      </ul>
      <h4>Earning tokens for free</h4>
      <ul>
        <li>Watch every ad video slot, every day — it compounds enormously over a season.</li>
        <li>League position, Cup and Champions League runs pay token rewards; even a semi-final run matters.</li>
        <li>Association weekend results pay tokens — a active association is a steady income.</li>
        <li>Special sponsors and events often gift tokens; check the event tab daily.</li>
      </ul>
      <h4>Budget sketch for a season</h4>
      <ul>
        <li>~60–70% on transfers (2–4 quality signings beats 8 average ones).</li>
        <li>~20% reserve for an emergency (injury crisis, title-race reinforcement).</li>
        <li>Whatever remains: contract renewals and the occasional Scout-list punt.</li>
      </ul>`,
  },
  {
    id: 'transfers',
    icon: '🔁',
    title: 'Transfers — auctions, negotiations, scouts & academy',
    summary: 'How to actually win auctions without overpaying, and when each signing route is worth it.',
    body: `
      <h4>Auction strategy</h4>
      <ul>
        <li><strong>Set a hard token ceiling before you bid.</strong> Decide the max, walk away above it. Bidding wars are how tokens die.</li>
        <li><strong>Bid in the final seconds of each round.</strong> Early bids only advertise your interest and pull in rivals.</li>
        <li><strong>Watch the bidder count.</strong> Two or more managers deep after round 3? Let it go — an identical player will appear within days.</li>
        <li><strong>Value marker:</strong> 18–19 year olds at high % with 1–2 special abilities go for silly prices. The same profile without an ability is often 70% cheaper and trains the ability later.</li>
        <li><strong>Buy qualities ending in 4 or 9</strong> — those players are one training step from their next star, so you get the star jump (and its market-value bump) almost free.</li>
        <li>Selling returns roughly the player's cash value, plus a cut of the tokens bidders spent — another reason to develop-and-sell fast trainers rather than hoard them.</li>
      </ul>
      <h4>Negotiations</h4>
      <ul>
        <li>Good for grabbing a specific profile without auction randomness, but you pay the owner's price plus fees — use for one missing piece, not squad building.</li>
        <li>List your own unused players; other managers' negotiation offers are free tokens.</li>
      </ul>
      <h4>Scout list & academy</h4>
      <ul>
        <li>Scout players are excellent quality but cost a premium — worth it mainly when you're pushing for a treble and need an instant starter.</li>
        <li>Academy youth are cheap and occasionally great fast trainers; always check the 18-year-old's quality before promoting or selling.</li>
      </ul>
      <h4>Selling</h4>
      <ul>
        <li>Sell declining players <em>before</em> the season ends — age ticks up at season rollover and 30+ players sell for scraps.</li>
        <li>A trained-up fast trainer sold at 24–25 often funds two new 18-year-old projects.</li>
      </ul>`,
  },
  {
    id: 'condition',
    icon: '💚',
    title: 'Condition, injuries & resource packs',
    summary: 'Managing greens, blues and reds is the hidden half of winning three competitions at once.',
    body: `
      <h4>How condition works</h4>
      <ul>
        <li>Players regenerate a few % of condition automatically every 15 minutes — plan around the clock, not just around matches.</li>
        <li>Matches cost roughly 25–40% condition depending on intensity and position; training costs whatever the drills say.</li>
        <li>Below ~70% condition performance drops and injury risk climbs steeply. Never start a key match under 80% if you can help it.</li>
      </ul>
      <h4>Green packs (rest)</h4>
      <ul>
        <li>Spend greens on players, not on impatience: boost right before a match, not hours earlier (regeneration would have done part of the job free).</li>
        <li>Farm greens from ad videos, league/CL/Cup rewards and Association chests. Hoard toward triple-match days.</li>
      </ul>
      <h4>Red packs (injuries)</h4>
      <ul>
        <li>Physio-room upgrades shorten injuries — reds go further with a better facility.</li>
        <li>Only insta-heal starters during congested weeks; a rotation player can heal on the bench for free.</li>
        <li>High training intensity below 60% condition is where most injuries come from. Don't do it.</li>
      </ul>
      <h4>Blue packs (morale)</h4>
      <ul>
        <li>Morale drips down after losses and benchings; low morale genuinely costs match rating.</li>
        <li>Boost your starting XI's morale before derbies and finals — it's the cheapest marginal gain in the game.</li>
      </ul>`,
  },
  {
    id: 'squad-building',
    icon: '🧱',
    title: 'Squad building & fast trainers',
    summary: 'Ideal squad size, the fast-trainer pipeline, and surviving the ~20% quality inflation every season.',
    body: `
      <h4>Squad size & shape</h4>
      <ul>
        <li><strong>16–19 players</strong> is the sweet spot: every extra player dilutes training resources and wages; fewer risks a crisis in triple-competition weeks.</li>
        <li>Cover every position of your main formation twice OR carry versatile players (e.g. DL/ML, MC/AMC, AMR/ST).</li>
        <li>One quality GK is enough; a cheap veteran backup covers emergencies.</li>
      </ul>
      <h4>The fast-trainer pipeline</h4>
      <ul>
        <li>Players aged <strong>18–21 gain skills fastest</strong>; gains slow through the mid-20s and near-stop by 29+.</li>
        <li>The classic engine: buy 18-year-olds early in the season, train them hard all season, they become your core — sell at 24–25 while value is high and restart.</li>
        <li>Lower-quality young players train faster per green than already-maxed stars — "one season ahead" quality is the efficient target.</li>
      </ul>
      <h4>Season inflation</h4>
      <ul>
        <li>Each new season your promoted league level raises the quality bar by roughly 20%. A 5-star player today is ~4 stars next season without training.</li>
        <li>Budget training time accordingly: young players outrun inflation, veterans fall behind it — that is the real reason to sell at 26+, not sentiment.</li>
      </ul>
      <h4>Special abilities & versatility</h4>
      <ul>
        <li>Special abilities (free kicks, corners, penalties, one-on-one…) add hidden value in exactly those situations; a free-kick specialist pays for himself over a season.</li>
        <li>Training a second position (via position trainers) makes rotation painless — prioritise it for fullbacks and wide mids.</li>
      </ul>`,
  },
  {
    id: 'tierup',
    icon: '💎',
    title: 'Personal trainer, tier-up & gems',
    summary: 'What to do when normal training stops being enough — and when paying is actually worth it.',
    body: `
      <h4>Personal trainer</h4>
      <ul>
        <li>Found on the player's Skills tab: tokens convert directly into skill points, with young players getting more points per token.</li>
        <li>Rule of thumb: it's only good value on <strong>measured fast trainers aged 18–21</strong> — the same players who convert normal training best. Paying tokens to push a slow or ageing player is burning the budget.</li>
        <li>Use the calculator on the Training tab to sanity-check any offer before spending.</li>
      </ul>
      <h4>Tier-up and gems</h4>
      <ul>
        <li>Normal training and the personal trainer cap out at <strong>180% quality</strong>. Beyond that, players tier up with gems that boost their <em>key attributes</em>.</li>
        <li>Gem tiers: rare +10%, elite +30%, stellar +50%, master +80%, epic +120% (to key attributes).</li>
        <li>Strategy: tier-up is endgame polish for one-club keepers — never tier up a player you might sell, and never before his position, playstyle and special ability are settled.</li>
      </ul>`,
  },
  {
    id: 'competitions',
    icon: '🏆',
    title: 'Competition strategy — League, Champions League, Cup',
    summary: 'Where to spend your squad\'s legs, and when a strategic loss is actually a win.',
    body: `
      <h4>Priorities</h4>
      <ul>
        <li>Decide on day one what you're really chasing. A treble needs an 18+ deep squad; most seasons, League + one cup run is the realistic double.</li>
        <li>The League pays the most consistent rewards and decides promotion — it's rarely the one to sacrifice.</li>
      </ul>
      <h4>Cup seeding</h4>
      <ul>
        <li>Cup draws bracket you with teams around your quality at draw time. A deliberately lean squad at season start can mean a much easier cup path — the famous "tanking the draw" trick: buy your big signings <em>after</em> the draw.</li>
      </ul>
      <h4>Fixture congestion</h4>
      <ul>
        <li>Triple-match days are condition wars, not tactics wars. Rotate the XI in the least important match rather than fielding tired starters in all three.</li>
        <li>Check tomorrow's schedule before every training session — never burn condition the evening before a triple day.</li>
      </ul>
      <h4>Reading opponents</h4>
      <ul>
        <li>Scout every opponent's recent formations and results (their profile shows both). Most managers never change tactics — set your counter hours ahead.</li>
        <li>Watch whether their manager attends matches. Absent managers can't react — an aggressive second-half push punishes them.</li>
      </ul>`,
  },
  {
    id: 'associations',
    icon: '🤝',
    title: 'Associations — tournaments and teamwork',
    summary: 'The weekend tournaments are the best free rewards in the game if the association is run right.',
    body: `
      <h4>Why bother</h4>
      <ul>
        <li>Association weekends pay tokens and rest packs on top of loot from milestones — a serious income stream.</li>
        <li>You can watch and support teammates' matches; active associations simply win more.</li>
      </ul>
      <h4>Running the weekend</h4>
      <ul>
        <li>Set your lineup and counter-tactics <em>before</em> the first whistle of each tie; matches fire on schedule whether you're online or not.</li>
        <li>Save condition on Friday: arrive at the weekend with the XI at 90%+.</li>
        <li>Coordinate in chat about who's online for live-match support bonuses.</li>
      </ul>
      <h4>Membership strategy</h4>
      <ul>
        <li>Promote active daily players; demote or replace managers who miss setting lineups — one AFK member costs the whole group a bracket.</li>
        <li>Joining an association slightly above your level pulls your rewards (and standards) upward.</li>
      </ul>`,
  },
  {
    id: 'matchday',
    icon: '⚽',
    title: 'Match-day craft — morale, subs and live management',
    summary: 'What actually moves the needle once the whistle blows.',
    body: `
      <h4>Before kickoff</h4>
      <ul>
        <li>Checklist: condition 80%+, morale high (blues on the XI if needed), counter-formation set, set-piece takers assigned, captain with high morale/quality.</li>
        <li>Assign your best shooter to free kicks and penalties, best crosser to corners — the defaults are often wrong.</li>
      </ul>
      <h4>Watching live</h4>
      <ul>
        <li>Attending the match gives your team a small but real boost — show up for finals and derbies.</li>
        <li><strong>Activate a teamplay bonus during the match</strong>: it plays at 1.5× its value for 20 minutes (an 8% Attack bonus becomes 12%). Save the activation for when you need it — chasing a goal or protecting a lead.</li>
        <li>Set a <strong>win bonus</strong> before big matches — it feeds morale, and morale feeds ratings.</li>
        <li>Losing at half-time as the better team? Raise mentality one notch and/or switch focus to the flank where your winger is winning his duel — don't rip up the whole tactic.</li>
        <li>Winning by two? Drop to Normal/Defensive around minute 70 and red-arrow the wingers; conserve condition for the next fixture.</li>
      </ul>
      <h4>Substitutions</h4>
      <ul>
        <li>Sub tired legs (under ~60% live condition) in midfield first — midfielders cover the most ground.</li>
        <li>A fresh striker against tired centre backs after minute 65 is the highest-value sub in the game.</li>
        <li>Never waste subs on 85+ minute time-burning if a starter might pick up a knock-level fatigue for the next match.</li>
      </ul>
      <h4>Possession myths</h4>
      <ul>
        <li>Possession is a style stat, not a win stat — counter-attacking 5-2-2-1s beat 65% possession teams every day. Judge your tactic by chances created and conceded, not the possession bar.</li>
      </ul>`,
  },
  {
    id: 'facilities',
    icon: '🏟️',
    title: 'Club development — stadium & facility build order',
    summary: 'Build the things that make players better before the things that look pretty.',
    body: `
      <h4>Recommended priority</h4>
      <ol>
        <li><strong>Training facilities</strong> — faster skill gains multiply everything else you do. Max these first, always.</li>
        <li><strong>Medical/physio</strong> — shorter injuries mean fewer wasted reds and fewer missed matches.</li>
        <li><strong>Youth academy</strong> — better free youth intakes; occasionally gifts a real fast trainer.</li>
        <li><strong>Stadium seats & extras</strong> — more match income. Useful, but money is the least scarce resource, so it comes last.</li>
      </ol>
      <h4>Money management</h4>
      <ul>
        <li>Cash piles up naturally from gates and prize money; the cap on progress is tokens and packs, not money — so let buildings finish before starting overlapping upgrades you can't fund.</li>
        <li>Sponsor deals: prefer the balanced or rest-pack-leaning offers over pure cash once your bank is healthy.</li>
      </ul>`,
  },
  {
    id: 'season-cycle',
    icon: '📅',
    title: 'The season cycle — a checklist',
    summary: 'What to do on day 1, mid-season, and in the final week — every season.',
    body: `
      <h4>Season start (days 1–3)</h4>
      <ul>
        <li>Market is flooded and cheap: buy your 18-year-old projects now (after the Cup draw if you're playing the seeding game).</li>
        <li>Renew expiring contracts immediately — morale penalties for unhandled contracts are silly losses.</li>
        <li>Set the season's training plan per player (this app's Player pages give you one).</li>
      </ul>
      <h4>Mid-season</h4>
      <ul>
        <li>Audit the squad around day 10: anyone underperforming their wage or blocking a youngster's minutes gets listed.</li>
        <li>Re-scout your title rivals' formations; adjust your default counter presets.</li>
        <li>Keep one eye on pack reserves — entering the final week with 20+ greens is the difference in the run-in.</li>
      </ul>
      <h4>Final week</h4>
      <ul>
        <li>Sell everyone you won't keep <em>before</em> rollover (they age +1 and lose value at season end).</li>
        <li>Spend leftover ad-video time farming greens/tokens for the day-1 market.</li>
        <li>If promotion is secured and matches are dead, rest the fast trainers and log training anyway — gains carry over; condition spent on meaningless matches doesn't.</li>
      </ul>`,
  },
];
