import json
import unittest

import scrape

HTML = r'''<html><script>
var x = 1;
FR.TerrainStatusFeed = {"Lifts":[{"Name":"Fitzsimmons } Express","Status":"Open","Mountain":"Whistler"},
 {"Name":"Magic \"Chair\" {","Status":"Closed","Mountain":"Blackcomb"}],
 "GroomingAreas":[{"Name":"Creekside [Bowl]","Runs":[
   {"Name":"Pony Trail","Difficulty":1,"IsOpen":true,"IsGroomed":true,"Mountain":"Whistler"},
   {"Name":"Green Line","Difficulty":"Easiest","IsOpen":false,"IsGroomed":false,"Mountain":"Blackcomb"}]}]};
FR.snowReportData = {"BaseDepth":{"Inches":10,"Centimeters":25},"Last24Hours":{"Inches":2}};
FR.Broken = {"a": };
</script></html>'''


class T(unittest.TestCase):
    def test_extract(self):
        blobs, problems = scrape.extract_fr_blobs(HTML)
        self.assertEqual(set(blobs), {"TerrainStatusFeed", "snowReportData"})
        self.assertEqual(len(problems), 1)
        self.assertEqual(blobs["TerrainStatusFeed"]["Lifts"][0]["Name"], "Fitzsimmons } Express")
        self.assertEqual(blobs["TerrainStatusFeed"]["Lifts"][1]["Name"], 'Magic "Chair" {')

    def test_collect(self):
        blobs, _ = scrape.extract_fr_blobs(HTML)
        c = scrape.Collector()
        c.walk(blobs["TerrainStatusFeed"], {})
        self.assertEqual(len(c.lifts), 2)
        self.assertEqual([r["difficulty"] for r in c.runs], ["green", "green"])
        self.assertEqual(c.runs[0]["mountain"], "Whistler")
        self.assertEqual(c.runs[1]["mountain"], "Blackcomb")
        self.assertTrue(c.runs[0]["open"] and c.runs[0]["groomed"])
        self.assertEqual(c.runs[0]["area"], "Creekside [Bowl]")

    def test_snow(self):
        blobs, _ = scrape.extract_fr_blobs(HTML)
        s = scrape.parse_snow({"snowReportData": blobs["snowReportData"]})
        self.assertEqual(s["base_cm"], 25.0)
        self.assertEqual(s["h24_cm"], 5.1)


if __name__ == "__main__":
    unittest.main()
