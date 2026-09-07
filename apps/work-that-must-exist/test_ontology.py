"""Meaningful compiler/schema checks; run with the same rdflib environment."""
from pathlib import Path
import tempfile
import unittest
from compile_ontology import compile_model, HERE


class OntologyBridgeTests(unittest.TestCase):
    def mutated(self, old, new):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "ontology.ttl"
            path.write_text((HERE / "ontology.ttl").read_text().replace(old, new))
            return compile_model(path)

    def test_foundation_and_completion_profile(self):
        model = compile_model()
        self.assertEqual({x["category"] for x in model["obligationTemplates"]}, {"Quality", "InformationContent"})
        self.assertEqual(len(model["actionTemplates"]), 8)
        self.assertEqual([x["id"] for x in model["units"]], ["a", "b"])

    def test_method_is_information_not_process_occurrence(self):
        with self.assertRaisesRegex(ValueError, "method specifications"):
            self.mutated("a w:ActionTemplate, d:MethodSpecification", "a w:ActionTemplate, d:WorkProcess")

    def test_incorrect_local_object_type_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "physical objects"):
            self.mutated("l:UnitA a d:InstallationUnit", "l:UnitA a d:InspectionEvidence")

    def test_rdf_effect_change_reaches_compiled_model(self):
        model = self.mutated('w:add ( "evidence-{unit}" )', 'w:add ( "reviewed-{unit}" )')
        self.assertEqual([x["add"] for x in model["actionTemplates"] if x["kind"] == "inspect"], [["reviewed-{unit}"], ["reviewed-{unit}"]])


if __name__ == "__main__":
    unittest.main()
