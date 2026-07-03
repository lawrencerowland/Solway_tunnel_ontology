#!/usr/bin/env python3
"""
kglab ontology audit spike - Solway Firth Tunnel
=================================================

Foray: FORAY-KGLAB-ONTOLOGY-AUDIT
Repo tab: apps/kglab-ontology-audit/

What this proves, end to end:
  1. LIFT      - the D3 graph embedded in apps/tunnel-ontology-visualizer/src/App.tsx
                 (30 nodes / 47 links) is lifted into RDF alongside the previously
                 unused ontology not_yet_used/tunnel-ontology-visualizer.ttl.txt.
                 Every lifted edge becomes a first-class EdgeAssertion carrying
                 edge-type, confidence, source(s) - the AGENTS.md provenance rule.
  2. RECONCILE - lifted D3 nodes are matched to ontology individuals by rdfs:label;
                 edges attested by BOTH representations get confidence 0.9 and dual
                 provenance; D3-only edges get 0.6 and single provenance.
  3. VALIDATE  - a SHACL shapes graph enforces the provenance discipline. Run 1
                 (raw lift) fails: plan-critical edges (dependsOn/precedes) lack
                 use-statement + update-trigger. A repair pass adds them from a
                 curated table; run 2 conforms.
  4. INFER     - OWL-RL closure materialises the Digital Construction Ontology
                 superclasses (dice:Object, dicp:Process, ...), so a census query
                 by upper-ontology class works without hand-written UNIONs.
  5. QUERY     - SPARQL -> pandas DataFrames: class census, weak plan-critical
                 edges, transitive dependency chain, corroboration table.
  6. MEASURE   - kglab subgraph -> NetworkX betweenness centrality (top brokers).

Outputs (all relative to this pipeline/ folder):
  ../data/d3_graph.json       - extracted D3 nodes/links (input, checked in)
  ../data/shapes.ttl          - SHACL shapes graph
  ../data/solway_merged.ttl   - merged, repaired, pre-closure graph
  ../data/results.json        - everything the tab page embeds
  ../index.html               - rebuilt from index.template.html + results.json

Run from repo root:  python3 apps/kglab-ontology-audit/pipeline/kglab_spike.py
Requires: kglab (pip install kglab) - tested on kglab 0.6.x / Python 3.10.
"""

import json
import pathlib
import sys

import kglab
import pandas as pd
import rdflib
from rdflib import Literal, URIRef
from rdflib.namespace import OWL, RDF, RDFS, XSD

HERE = pathlib.Path(__file__).resolve().parent
APP = HERE.parent
REPO = APP.parent.parent
DATA = APP / "data"
DATA.mkdir(exist_ok=True)

TTL_SOURCE = REPO / "not_yet_used" / "tunnel-ontology-visualizer.ttl.txt"
D3_SOURCE = DATA / "d3_graph.json"

ST = rdflib.Namespace("http://example.org/solwaytunnel#")
STV = rdflib.Namespace("http://example.org/solwaytunnel/vocab#")
STD3 = rdflib.Namespace("http://example.org/solwaytunnel/d3#")
STE = rdflib.Namespace("http://example.org/solwaytunnel/edge#")
DICE = rdflib.Namespace("https://w3id.org/digitalconstruction/Entities#")
DICP = rdflib.Namespace("https://w3id.org/digitalconstruction/Processes#")
DICA = rdflib.Namespace("https://w3id.org/digitalconstruction/Agents#")
DICI = rdflib.Namespace("https://w3id.org/digitalconstruction/Information#")
DICBM = rdflib.Namespace("https://w3id.org/digitalconstruction/BuildingMaterials#")
DICL = rdflib.Namespace("https://w3id.org/digitalconstruction/Lifecycle#")
DCT = rdflib.Namespace("http://purl.org/dc/terms/")

# D3 group -> Digital Construction Ontology superclass (mirrors the TTL's own
# subClassOf targets), so OWL-RL closure lands lifted nodes in the same upper
# ontology as the curated individuals.
GROUP_SUPER = {
    "Entity": DICE.Object,
    "Material": DICBM.Material,
    "Process": DICP.Process,
    "Agent": DICA.Agent,
    "Information": DICI.InformationContentEntity,
    "Lifecycle": DICL.LifecyclePhase,
}

PLAN_CRITICAL = {"dependsOn", "precedes"}

# Curated repair table for plan-critical edges: the use statement and update
# trigger demanded by the AGENTS.md edge discipline. Keyed by (source, target)
# exactly as the edges appear in the D3 data.
REPAIRS = {
    ("TBMExcavation", "SitePreparation"): (
        "Sequencing constraint: TBM launch chamber must exist before main drive.",
        "Re-check if launch site layout or TBM procurement changes.",
    ),
    ("SegmentInstallation", "TBMExcavation"): (
        "Ring build can only follow the advancing bore.",
        "Re-check if TBM type changes (open vs closed face).",
    ),
    ("SitePreparation", "ConstructionPhase"): (
        "Site establishment gates the construction phase start.",
        "Re-check if early-works packages start ahead of main phase.",
    ),
    ("FeasibilityPhase", "DesignPhase"): (
        "Phase gate: design funding released by feasibility approval.",
        "Re-check if phased/parallel delivery is adopted.",
    ),
    ("DesignPhase", "ConstructionPhase"): (
        "Phase gate: approved-for-construction design required.",
        "Re-check if early-works packages are split out.",
    ),
    ("ConstructionPhase", "CommissioningPhase"): (
        "Phase gate: systems installation complete before commissioning.",
        "Re-check if sectional commissioning is adopted.",
    ),
    ("CommissioningPhase", "OperationalPhase"): (
        "Phase gate: safety case acceptance before public operation.",
        "Re-check against regulator engagement plan.",
    ),
}

SHAPES_TTL = """\
@prefix sh:   <http://www.w3.org/ns/shacl#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix dct:  <http://purl.org/dc/terms/> .
@prefix stv:  <http://example.org/solwaytunnel/vocab#> .
@prefix st:   <http://example.org/solwaytunnel#> .

# Shape 1 - every lifted edge assertion must carry the base provenance record:
# an edge type, a confidence in [0,1], and at least one source.
stv:EdgeAssertionShape
    a sh:NodeShape ;
    sh:targetClass stv:EdgeAssertion ;
    sh:property [
        sh:path stv:edgeType ;
        sh:minCount 1 ;
        sh:message "Edge assertion missing edge type." ;
    ] ;
    sh:property [
        sh:path stv:confidence ;
        sh:minCount 1 ; sh:maxCount 1 ;
        sh:datatype xsd:decimal ;
        sh:minInclusive 0.0 ; sh:maxInclusive 1.0 ;
        sh:message "Edge assertion missing confidence in [0,1]." ;
    ] ;
    sh:property [
        sh:path dct:source ;
        sh:minCount 1 ;
        sh:message "Edge assertion missing provenance source." ;
    ] .

# Shape 2 - plan-critical edges (dependsOn / precedes) additionally need the
# AGENTS.md contingent-edge fields: a use statement and an update trigger.
stv:PlanCriticalEdgeShape
    a sh:NodeShape ;
    sh:targetClass stv:PlanCriticalEdge ;
    sh:property [
        sh:path stv:useStatement ;
        sh:minCount 1 ;
        sh:message "Plan-critical edge missing use statement." ;
    ] ;
    sh:property [
        sh:path stv:updateTrigger ;
        sh:minCount 1 ;
        sh:message "Plan-critical edge missing update trigger." ;
    ] .
"""


def build_kg() -> kglab.KnowledgeGraph:
    return kglab.KnowledgeGraph(
        name="Solway Firth Tunnel - audited KG",
        base_uri="http://example.org/solwaytunnel#",
        namespaces={
            "st": str(ST), "stv": str(STV), "std3": str(STD3), "ste": str(STE),
            "dice": str(DICE), "dicp": str(DICP), "dica": str(DICA),
            "dici": str(DICI), "dicbm": str(DICBM), "dicl": str(DICL),
            "dct": str(DCT),
        },
    )


def lift_d3(kg: kglab.KnowledgeGraph, d3: dict) -> dict:
    """Lift the D3 nodes/links into RDF with EdgeAssertion provenance."""
    g = kg.rdf_graph()
    label_index = {}  # ontology rdfs:label -> individual IRI (for reconciliation)
    for s, _, o in g.triples((None, RDFS.label, None)):
        if isinstance(s, URIRef) and (s, RDF.type, OWL.Class) not in g:
            label_index[str(o)] = s

    stats = {"nodes": 0, "matched_nodes": 0, "corroborated": 0, "d3_only": 0}
    node_iri, node_match = {}, {}

    for n in d3["nodes"]:
        iri = STD3[n["id"]]
        node_iri[n["id"]] = iri
        g.add((iri, RDF.type, STV[n["group"]]))
        g.add((iri, RDFS.label, Literal(n["label"])))
        g.add((iri, DCT.source, Literal("apps/tunnel-ontology-visualizer/src/App.tsx")))
        stats["nodes"] += 1
        m = label_index.get(n["label"])
        if m is not None:
            g.add((iri, OWL.sameAs, m))
            node_match[n["id"]] = m
            stats["matched_nodes"] += 1

    # subclass bridge into the Digital Construction Ontology upper classes
    for group, sup in GROUP_SUPER.items():
        g.add((STV[group], RDF.type, OWL.Class))
        g.add((STV[group], RDFS.subClassOf, sup))
        g.add((STV[group], RDFS.label, Literal(f"D3 {group} (lifted)")))

    for i, link in enumerate(d3["links"], start=1):
        s_id, o_id, pred = link["source"], link["target"], link["label"]
        s, o = node_iri[s_id], node_iri[o_id]
        p = DICE.hasSubOrganization if pred == "hasSubOrganization" else ST[pred]
        g.add((s, p, o))  # direct triple - what property paths traverse

        # corroboration check: same edge between matched ontology individuals?
        corroborated = False
        ms, mo = node_match.get(s_id), node_match.get(o_id)
        if ms is not None and mo is not None and (ms, p, mo) in g:
            corroborated = True

        e = STE[f"e{i:03d}"]
        g.add((e, RDF.type, STV.EdgeAssertion))
        g.add((e, RDF.subject, s))
        g.add((e, RDF.predicate, p))
        g.add((e, RDF.object, o))
        g.add((e, STV.edgeType, p))
        g.add((e, DCT.source, Literal("apps/tunnel-ontology-visualizer/src/App.tsx")))
        if corroborated:
            g.add((e, STV.confidence, Literal("0.9", datatype=XSD.decimal)))
            g.add((e, DCT.source, Literal("not_yet_used/tunnel-ontology-visualizer.ttl.txt")))
            g.add((e, STV.corroborated, Literal(True)))
            stats["corroborated"] += 1
        else:
            g.add((e, STV.confidence, Literal("0.6", datatype=XSD.decimal)))
            g.add((e, STV.corroborated, Literal(False)))
            stats["d3_only"] += 1
        if pred in PLAN_CRITICAL:
            g.add((e, RDF.type, STV.PlanCriticalEdge))
            # NOTE: useStatement / updateTrigger deliberately NOT added here -
            # the raw lift should FAIL shape 2, exactly like an undocumented
            # dependency in a real plan. The repair pass fills them in.
    return stats


def repair(kg: kglab.KnowledgeGraph) -> int:
    """Add use statements + update triggers to plan-critical edges."""
    g = kg.rdf_graph()
    fixed = 0
    for e in list(g.subjects(RDF.type, STV.PlanCriticalEdge)):
        s = g.value(e, RDF.subject)
        o = g.value(e, RDF.object)
        key = (str(s).split("#")[-1], str(o).split("#")[-1])
        if key in REPAIRS:
            use, trig = REPAIRS[key]
            g.add((e, STV.useStatement, Literal(use)))
            g.add((e, STV.updateTrigger, Literal(trig)))
            fixed += 1
    return fixed


def validate(kg: kglab.KnowledgeGraph):
    conforms, _report_graph, report_text = kg.validate(
        shacl_graph=SHAPES_TTL, shacl_graph_format="turtle"
    )
    return bool(conforms), str(report_text)


def df_records(df: pd.DataFrame) -> list:
    def clean(v):
        if v is None:
            return None
        s = str(v)
        for ns, px in [(str(STD3), ""), (str(STV), "stv:"), (str(ST), "st:"),
                       (str(STE), "ste:"), (str(DICE), "dice:"), (str(DICP), "dicp:"),
                       (str(DICA), "dica:"), (str(DICI), "dici:"),
                       (str(DICBM), "dicbm:"), (str(DICL), "dicl:")]:
            if s.startswith(ns):
                return px + s[len(ns):]
        return s
    return [{k: clean(v) for k, v in row.items()} for row in df.to_dict("records")]


def main():
    results = {"steps": []}

    # -- 1. load + lift ------------------------------------------------------
    kg = build_kg()
    kg.load_rdf(str(TTL_SOURCE), format="ttl")
    n_ont = len(kg.rdf_graph())
    d3 = json.loads(D3_SOURCE.read_text())
    stats = lift_d3(kg, d3)
    results["lift"] = {
        "ontology_triples": n_ont,
        "d3_nodes": stats["nodes"],
        "d3_links": len(d3["links"]),
        "nodes_matched_by_label": stats["matched_nodes"],
        "edges_corroborated_by_both": stats["corroborated"],
        "edges_d3_only": stats["d3_only"],
        "triples_after_lift": len(kg.rdf_graph()),
    }

    # -- 2. SHACL run 1: raw lift should fail --------------------------------
    conforms1, report1 = validate(kg)
    results["shacl_run1"] = {"conforms": conforms1, "report": report1}

    # -- 3. repair + SHACL run 2 ---------------------------------------------
    fixed = repair(kg)
    conforms2, report2 = validate(kg)
    results["shacl_run2"] = {"conforms": conforms2, "repaired_edges": fixed,
                             "report": report2}
    (DATA / "shapes.ttl").write_text(SHAPES_TTL)
    kg.save_rdf(str(DATA / "solway_merged.ttl"), format="ttl")
    triples_pre_closure = len(kg.rdf_graph())

    # -- 4. OWL-RL closure ----------------------------------------------------
    kg.infer_owlrl_closure()
    results["closure"] = {
        "triples_before": triples_pre_closure,
        "triples_after": len(kg.rdf_graph()),
    }

    # -- 5. SPARQL -> DataFrames ---------------------------------------------
    # count DISTINCT labels, not IRIs: after owl:sameAs closure a reconciled
    # individual carries two IRIs (st: and std3:) but one label.
    q_census = """
        SELECT ?upperClass (COUNT(DISTINCT ?lbl) AS ?individuals)
        WHERE {
          VALUES ?upperClass { dice:Object dicp:Process dica:Agent
                               dici:InformationContentEntity dicbm:Material
                               dicl:LifecyclePhase }
          ?x a ?upperClass ;
             <http://www.w3.org/2000/01/rdf-schema#label> ?lbl .
          FILTER NOT EXISTS { ?x a <http://www.w3.org/2002/07/owl#Class> }
        }
        GROUP BY ?upperClass ORDER BY DESC(?individuals)
    """
    df_census = kg.query_as_df(q_census)
    results["census"] = df_records(df_census)

    q_weak = """
        SELECT ?from ?edge ?to ?confidence
        WHERE {
          ?e a stv:PlanCriticalEdge ;
             <http://www.w3.org/1999/02/22-rdf-syntax-ns#subject> ?from ;
             stv:edgeType ?edge ;
             <http://www.w3.org/1999/02/22-rdf-syntax-ns#object> ?to ;
             stv:confidence ?confidence .
          FILTER (?confidence < 0.7)
          FILTER (STRSTARTS(STR(?from), "http://example.org/solwaytunnel/d3#"))
          FILTER (STRSTARTS(STR(?to),   "http://example.org/solwaytunnel/d3#"))
        } ORDER BY ?confidence ?from
    """
    df_weak = kg.query_as_df(q_weak)
    results["weak_plan_edges"] = df_records(df_weak)

    q_chain = """
        SELECT DISTINCT ?upstream
        WHERE {
          std3:SegmentInstallation st:dependsOn+ ?upstream .
          FILTER (STRSTARTS(STR(?upstream), "http://example.org/solwaytunnel/d3#"))
        }
    """
    df_chain = kg.query_as_df(q_chain)
    results["dependency_chain"] = df_records(df_chain)

    q_corr = """
        SELECT ?corroborated (COUNT(?e) AS ?edges)
               (ROUND(AVG(?c) * 100) / 100 AS ?meanConfidence)
        WHERE {
          ?e a stv:EdgeAssertion ;
             stv:corroborated ?corroborated ;
             stv:confidence ?c .
        } GROUP BY ?corroborated ORDER BY DESC(?corroborated)
    """
    df_corr = kg.query_as_df(q_corr)
    results["corroboration"] = df_records(df_corr)

    # -- 6. graph measure: betweenness over the lifted edge layer -------------
    import networkx as nx
    q_edges = """
        SELECT ?s ?o WHERE {
          ?e a stv:EdgeAssertion ;
             <http://www.w3.org/1999/02/22-rdf-syntax-ns#subject> ?s ;
             <http://www.w3.org/1999/02/22-rdf-syntax-ns#object>  ?o .
          FILTER (STRSTARTS(STR(?s), "http://example.org/solwaytunnel/d3#"))
          FILTER (STRSTARTS(STR(?o), "http://example.org/solwaytunnel/d3#"))
        }
    """
    try:
        subgraph = kglab.SubgraphMatrix(kg=kg, sparql=q_edges)
        nxg = subgraph.build_nx_graph(nx.DiGraph())
    except Exception:
        nxg = nx.DiGraph()
        for row in kg.query_as_df(q_edges).to_dict("records"):
            nxg.add_edge(str(row["s"]).split("#")[-1], str(row["o"]).split("#")[-1])
    bc = nx.betweenness_centrality(nxg)
    top = sorted(bc.items(), key=lambda kv: -kv[1])[:5]
    label = lambda n: str(n).split("#")[-1] if "#" in str(n) else str(n)
    results["centrality_top5"] = [
        {"node": label(n), "betweenness": round(v, 4)} for n, v in top
    ]

    results["environment"] = {
        "kglab": kglab.__version__,
        "python": sys.version.split()[0],
    }

    (DATA / "results.json").write_text(json.dumps(results, indent=1))

    # -- 7. rebuild the tab page from template --------------------------------
    template = (APP / "index.template.html")
    if template.exists():
        html = template.read_text().replace(
            "/*__RESULTS__*/", json.dumps(results)
        )
        (APP / "index.html").write_text(html)

    print(json.dumps({k: v for k, v in results.items()
                      if k not in ("shacl_run1", "shacl_run2")}, indent=1)[:2000])
    print("SHACL run 1 conforms:", results["shacl_run1"]["conforms"])
    print("SHACL run 2 conforms:", results["shacl_run2"]["conforms"],
          "| repaired:", results["shacl_run2"]["repaired_edges"])


if __name__ == "__main__":
    main()
