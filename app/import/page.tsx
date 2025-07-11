const handleFileUpload = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    const plays = text.split("\n").filter((line) => line.trim());

    const parsedData = plays.map((play) => {
      const normalizedName = normalizePlayerName(play.split(" ")[0]);
      const result = parsePlayResult(play);
      console.log(`[DEBUG] Play: ${play} -> ${JSON.stringify(result)}`);
      return { player: normalizedName, ...result };
    });

    if (validateParsedData(parsedData)) {
      saveToDatabase(parsedData);
    } else {
      console.error("Validation failed: Check for hit/error conflicts.");
    }
  };
  reader.readAsText(file);
};