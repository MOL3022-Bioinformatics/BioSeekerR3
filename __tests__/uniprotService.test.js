import { fetchUniProtData } from "@/services/uniprotService";

describe("UniProt API", () => {
  test("Should fetch UniProt data for a valid ID", async () => {
    const uniprotId = "P12345";
    const data = await fetchUniProtData(uniprotId);

    expect(data).toHaveProperty("sequence");
  });
});
