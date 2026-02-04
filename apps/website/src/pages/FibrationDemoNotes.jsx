export default function FibrationDemoNotes() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-serif text-2xl">Fibration demo notes</h1>
        <p className="font-sans">
          Refined idea: Milestone fibration + explicit interface pullbacks.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="font-serif text-xl">What I’m keeping</h2>
        <p>
          Your original framing is very usable:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Base = a small, stable set of programme gates/milestones (funding gate, consents, design freeze, contract award, etc.).</li>
          <li>Fibers = each workstream’s local deliverables that are anchored to those gates.</li>
          <li>Pullbacks = explicit interface contracts that represent cross-team dependencies.</li>
        </ul>
        <p>
          This is a good idea because it gives you:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Local autonomy (teams plan locally).</li>
          <li>Global coherence (interfaces + gates force alignment).</li>
          <li>Mechanical change propagation (when gates move, anchored things move consistently).</li>
          <li>Auditability (every move and its consequences have receipts).</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl">What I’m correcting / tightening</h2>
        <p>
          The main correction is to treat “fibration” and “pullback” as real structural disciplines (not just metaphors):
        </p>
        <div className="space-y-2">
          <h3 className="font-serif text-lg">1) “Fibration” should mean “reindexing is principled and logged”</h3>
          <p>
            In category terms, the clean way to think about this is: your deliverables-over-milestones behave like a presheaf, and the “total space” is the category-of-elements construction (often called the Grothendieck construction, named after Alexander Grothendieck).
          </p>
          <p>In PM terms, translate that to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Every deliverable has an anchor gate.</li>
            <li>Every base change produces an automatic proposed lift.</li>
            <li>Any deviation (an exemption, a manual override, a different local policy) is explicit, not “silent drift”.</li>
            <li>Every lift produces a receipt.</li>
          </ul>
          <p>
            So the improvement is: exemptions are first-class rather than “random spreadsheet exceptions”.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-lg">2) “Pullback” should be a third thing (a contract), not just a line</h3>
          <p>
            Instead of “A depends on B”, you create an explicit interface object:
          </p>
          <p>
            Interface Contract (spec version, acceptance suite, shared environment receipt, evidence bundle).
          </p>
          <p>
            A and B both map to that contract (conformance/compatibility).
          </p>
          <p>
            The pullback is “pairs (a,b) that agree on the same contract state”.
          </p>
          <p>That makes dependencies:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>testable,</li>
            <li>versioned,</li>
            <li>owned on both sides,</li>
            <li>and queryable.</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-lg">3) Base is usually a poset (partial order), not always a single ladder</h3>
          <p>
            Real programmes have gates that are not perfectly linear:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Some can run in parallel.</li>
            <li>Some are conditional.</li>
            <li>Some split/merge.</li>
          </ul>
          <p>
            So the improved method treats the base as a milestone graph (a partial order), even if you render it as a simple ladder for humans.
          </p>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-xl">The interactive example: Solway Firth Tunnel (hypothetical)</h2>
        <h3 className="font-serif text-lg">What you get in the HTML demo</h3>
        <p>Open the HTML file you downloaded. It includes:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Base milestones panel</li>
          <li>Edit gate dates</li>
          <li>Apply slips (+7 / -7 buttons)</li>
          <li>Optional toggle: propagate slip forward</li>
          <li>Workstream fibers panel</li>
          <li>Each workstream has deliverables anchored to gates</li>
          <li>You can change: status (todo / in progress / done), version (v1 / v2 / …), exemption from slip (checkbox)</li>
          <li>Interface pullbacks panel</li>
          <li>Each interface contract shows: left item + right item (with versions/status), a “rule”, an “acceptance” receipt, status: OK vs blocked</li>
          <li>Receipts log panel</li>
          <li>Every base change, local change, and glue-check produces a log entry.</li>
          <li>And: there are lots of “?” explainer buttons throughout.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl">How to use the demo (do this in order)</h2>
        <div className="space-y-2">
          <h3 className="font-serif text-lg">Step A — Learn the three primitives</h3>
          <p>
            Click the “?” buttons next to:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Base milestones</li>
            <li>Workstream fibers</li>
            <li>Interface pullbacks</li>
          </ul>
          <p>
            You’ll see short explainers written in plain PM language (and an optional “category theory overlay” toggle).
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-lg">Step B — Trigger a realistic programme event: consent delay</h3>
          <p>Press the scenario button:</p>
          <p className="italic">“Consent delay (+60d on M2)”</p>
          <p>What should happen (and you’ll see it happen):</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>M2 slips.</li>
            <li>Any deliverable anchored to M2 now has a later computed due date.</li>
            <li>Later gates may slip too if “propagate slip forward” is toggled on.</li>
            <li>The receipts log records what moved.</li>
          </ul>
          <p>
            This is the fibration lift in practice: base movement → consistent fiber reindexing.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-lg">Step C — Run the “glue check”</h3>
          <p>Click:</p>
          <p className="italic">“Run ‘glue’ check”</p>
          <p>You’ll either see:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>✅ all interface pullbacks consistent (global view can be glued), or</li>
            <li>❌ blocked interfaces (local-to-global inconsistency).</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-lg">Step D — Introduce a real cross-team mismatch: ground model revision</h3>
          <p>Press:</p>
          <p className="italic">“Ground model v2 late”</p>
          <p>This changes versions on the geotech side without matching the civil side. You should see:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>PB-1 (Ground Model ↔ Alignment freeze) turns blocked.</li>
            <li>The reason is displayed (version mismatch and/or status not done).</li>
            <li>The receipts log records the causal chain.</li>
          </ul>
          <p>
            This is exactly the pain point in mega-projects: it’s not “a dependency line”, it’s a contract mismatch.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-lg">Step E — Repair the mismatch (the key learning)</h3>
          <p>To “fix” PB-1 you do the real-world fix:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Set the Civil “Alignment frozen” item to version v2.</li>
            <li>Mark both items done.</li>
          </ul>
          <p>PB-1 will turn green.</p>
          <p>
            That’s the whole point: global coherence becomes a checkable property of explicit overlaps.
          </p>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-xl">What this improves compared to normal dependency linking</h2>
        <p>Normal tools often do:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>dependencies = arrows</li>
          <li>slips = date arithmetic</li>
          <li>interfaces = implicit / hidden</li>
        </ul>
        <p>This model forces:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>dependencies = interface contracts</li>
          <li>slips = lift rules with explicit exemptions</li>
          <li>interfaces = test receipts + versioned joins</li>
        </ul>
        <p>So you get:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>fewer invisible contradictions</li>
          <li>faster “what broke” diagnosis</li>
          <li>cleaner rebaseline mechanics</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-xl">How this connects to your sheaf direction</h2>
        <p>
          This fibration/pullback demo is exactly the same skeleton you need for sheaf-style “local data → global metric” work:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>2024 12 Applying Sheaves to Mod… dy models “local risk sets + restriction maps + gluing into a global risk profile.”</li>
          <li>2024 12 Resource Allocation U… els “local resource functions over overlaps + gluing into a global resource curve.”</li>
          <li>2025 04 audit of local to globa… ruction/contradiction demo. This HTML prototype is a direct step in that direction.</li>
        </ul>
        <p>
          So: this isn’t a detour—this is a UI/operational surface for the sheaf engine.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-xl">If you want the next iteration (very feasible)</h2>
        <p>I can extend the same HTML prototype to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Use a WBS graph as the base (not just milestone gates)</li>
          <li>Add a real risk sheaf (discrete or continuous) with a global risk metric</li>
          <li>Add a real resource sheaf (functions over time intervals) with a global curve</li>
          <li>Add a simple obstruction detector (when gluing fails, highlight the minimal overlap(s) causing failure)</li>
        </ul>
        <p>
          If you say “let’s go”, I’ll implement (2) + (4) first, because it makes the tool diagnostic, not just descriptive.
        </p>
      </section>
    </div>
  );
}
