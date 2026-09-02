export const autoCalculateAppearance = (app: any, changedField: string, force = true): any => {
  const data = { ...app };

  const isMale = data.gender === 'Männlich';
  const isFemale = !isMale;
  const build = data.build || 'Schlank';
  const age = parseInt(data.age) || 20;

  const cupToBustAdd: Record<string, number> = {
    "-": 0,
    "AA": 75,
    "A": 82,
    "B": 86,
    "C": 90,
    "D": 94,
    "E": 98,
    "F": 102,
    "G": 106,
    "H": 110,
    "I": 114,
    "J": 118,
    "K": 122,
    "L": 126,
    "M": 130,
    "N": 134
  };

  // 1. GENDER & AGE changes
  if (changedField === 'gender' || changedField === 'age') {
    if (isMale) {
      // For boys/men, calculate male/default measurements
      let chest = 100;
      let waist = 85;
      let hips = 95;
      
      if (build === 'Muskulös') { chest += 15; waist -= 5; }
      if (build === 'Schlank' || build === 'Zierlich') { chest -= 10; waist -= 10; hips -= 5; }
      if (build === 'Stämmig') { chest += 20; waist += 25; hips += 15; }
      if (build === 'Kräftig') { chest += 10; waist += 10; hips += 10; }
      
      data.measurements = `${chest}-${waist}-${hips}`;
    } else if (isFemale) {
      if (data.cupSize === '-' || !data.cupSize) {
        data.cupSize = 'B';
      }
    }
  }

  // 2. HEIGHT changes
  if (changedField === 'height') {
    const h = parseInt(data.height) || 165;
    if (data.measurements && data.measurements.includes('-')) {
      const parts = data.measurements.split('-');
      if (parts.length === 3) {
        let hips = h - 75;
        if (build === 'Kurvig') hips += 15;
        if (build === 'Schlank' || build === 'Zierlich') hips -= 5;
        if (build === 'Stämmig') hips += 10;
        if (build === 'Kräftig') hips += 5;
        if (hips < 50) hips = 50;
        data.measurements = `${parts[0]}-${parts[1]}-${hips}`;
      }
    }
  }

  // 3. MEASUREMENTS changes (user enters custom bust-waist-hips)
  if (changedField === 'measurements' && data.measurements) {
    const parts = data.measurements.split('-');
    if (parts.length > 0) {
      const bustNum = parseInt(parts[0].replace(/\D/g, ''));
      if (!isNaN(bustNum)) {
        data.chestSize = `${bustNum}cm`;
        if (isFemale && age >= 14) {
          if (bustNum < 78) data.cupSize = "AA";
          else if (bustNum <= 82) data.cupSize = "A";
          else if (bustNum <= 85) data.cupSize = "B";
          else if (bustNum <= 89) data.cupSize = "C";
          else if (bustNum <= 93) data.cupSize = "D";
          else if (bustNum <= 97) data.cupSize = "E";
          else if (bustNum <= 101) data.cupSize = "F";
          else if (bustNum <= 105) data.cupSize = "G";
          else if (bustNum <= 109) data.cupSize = "H";
          else if (bustNum <= 113) data.cupSize = "I";
          else if (bustNum <= 117) data.cupSize = "J";
          else if (bustNum <= 121) data.cupSize = "K";
          else if (bustNum <= 125) data.cupSize = "L";
          else if (bustNum <= 129) data.cupSize = "M";
          else data.cupSize = "N";
        }
      }
    }
  }

  // 4. BUILD or GENDER or AGE changes (recalculate base height and measurements)
  if (changedField === 'build' || changedField === 'gender' || changedField === 'age') {
    const hasCustomHeight = data.height && data.height !== 'Unbekannt' && data.height !== '-' && data.height !== '';
    if (force || !hasCustomHeight) {
      let baseHeight = isMale ? 178 : (isFemale ? 165 : 170);
      if (age < 12) baseHeight -= 30;
      else if (age < 15) baseHeight -= 15;

      if (build === 'Zierlich' || build === 'Hager') baseHeight -= 8;
      if (build === 'Stämmig' || build === 'Kräftig') baseHeight += 5;
      if (build === 'Groß' || build === 'Riesig') baseHeight += 20;

      data.height = `${baseHeight}cm`;
    }
    
    const hasCustomMeasurements = data.measurements && data.measurements !== 'Unbekannt' && data.measurements !== '-' && data.measurements !== '';
    if (force || !hasCustomMeasurements) {
      if (isFemale && age >= 14) {
         let waist = 65;
         let hips = parseInt(data.height) ? (parseInt(data.height) - 75) : 90; 
         
         if (build === 'Kurvig') { waist += 5; hips += 15; }
         if (build === 'Schlank' || build === 'Zierlich') { hips -= 5; waist -= 5; }
         if (build === 'Sportlich') { waist += 2; hips += 0; }
         if (build === 'Stämmig') { waist += 15; hips += 10; }
         if (build === 'Kräftig') { waist += 10; hips += 5; }

         let bust = cupToBustAdd[data.cupSize] || 86;
         if (build === 'Stämmig') bust += 10;
         if (build === 'Kräftig') bust += 5;
         
         data.measurements = `${bust}-${waist}-${hips}`;
         data.chestSize = `${bust}cm`;
      } else if (isMale && age >= 14) {
         let chest = 100;
         let waist = 85;
         let hips = 95;
         if (build === 'Muskulös') { chest += 15; waist -= 5; }
         if (build === 'Schlank') { chest -= 10; waist -= 10; hips -= 5; }
         if (build === 'Stämmig') { chest += 20; waist += 25; hips += 15; }
         if (build === 'Kräftig') { chest += 10; waist += 10; hips += 10; }
         
         data.measurements = `${chest}-${waist}-${hips}`;
         data.chestSize = `${chest}cm`;
      }
    }

    // Auto-calculate Weight, Body Fat and Muscle Mass defaults
    const isFemaleNow = (data.gender || '').toLowerCase() === 'weiblich';
    if (build === 'Schlank') {
      data.weight = isFemaleNow ? '50kg' : '65kg';
      data.bodyFat = isFemaleNow ? '15%' : '8%';
      data.muscleMass = isFemaleNow ? '25%' : '32%';
    } else if (build === 'Zierlich') {
      data.weight = isFemaleNow ? '44kg' : '55kg';
      data.bodyFat = isFemaleNow ? '13%' : '7%';
      data.muscleMass = isFemaleNow ? '20%' : '28%';
    } else if (build === 'Hager') {
      data.weight = isFemaleNow ? '46kg' : '58kg';
      data.bodyFat = isFemaleNow ? '10%' : '6%';
      data.muscleMass = isFemaleNow ? '18%' : '26%';
    } else if (build === 'Drahtig') {
      data.weight = isFemaleNow ? '52kg' : '70kg';
      data.bodyFat = isFemaleNow ? '12%' : '7%';
      data.muscleMass = isFemaleNow ? '30%' : '38%';
    } else if (build === 'Muskulös') {
      data.weight = isFemaleNow ? '58kg' : '82kg';
      data.bodyFat = isFemaleNow ? '14%' : '8%';
      data.muscleMass = isFemaleNow ? '38%' : '46%';
    } else if (build === 'Sportlich') {
      data.weight = isFemaleNow ? '60kg' : '78kg';
      data.bodyFat = isFemaleNow ? '20%' : '13%';
      data.muscleMass = isFemaleNow ? '35%' : '42%';
    } else if (build === 'Kurvig') {
      data.weight = isFemaleNow ? '72kg' : '85kg';
      data.bodyFat = isFemaleNow ? '30%' : '22%';
      data.muscleMass = isFemaleNow ? '26%' : '34%';
    } else if (build === 'Kräftig') {
      data.weight = isFemaleNow ? '78kg' : '94kg';
      data.bodyFat = isFemaleNow ? '29%' : '23%';
      data.muscleMass = isFemaleNow ? '38%' : '45%';
    } else if (build === 'Stämmig') {
      data.weight = isFemaleNow ? '88kg' : '105kg';
      data.bodyFat = isFemaleNow ? '38%' : '30%';
      data.muscleMass = isFemaleNow ? '28%' : '36%';
    } else {
      data.weight = isFemaleNow ? '65kg' : '80kg';
      data.bodyFat = isFemaleNow ? '22%' : '15%';
      data.muscleMass = isFemaleNow ? '30%' : '38%';
    }
  }

  // 5. CUP SIZE changes
  if (changedField === 'cupSize') {
     let bust = cupToBustAdd[data.cupSize] || 86;
     if (build === 'Stämmig') bust += 10;
     if (build === 'Kräftig') bust += 5;
     
     data.chestSize = `${bust}cm`;
     if (data.measurements && data.measurements.includes('-')) {
       const parts = data.measurements.split('-');
       if (parts.length === 3) {
         data.measurements = `${bust}-${parts[1]}-${parts[2]}`;
       }
     } else {
       let waist = isMale ? 85 : 65;
       let hips = parseInt(data.height) ? (parseInt(data.height) - 75) : (isMale ? 95 : 90); 
       if (build === 'Kurvig') { waist += 5; hips += 15; }
       if (build === 'Schlank' || build === 'Zierlich') { hips -= 5; waist -= 5; }
       if (build === 'Sportlich') { waist += 2; hips += 0; }
       if (build === 'Stämmig') { waist += 15; hips += 10; }
       if (build === 'Kräftig') { waist += 10; hips += 5; }
       data.measurements = `${bust}-${waist}-${hips}`;
     }
  }

  // 6. CHEST SIZE changes
  if (changedField === 'chestSize') {
     const chestNum = parseInt(data.chestSize.replace(/\D/g, ''));
     if (!isNaN(chestNum)) {
       if (chestNum < 78) data.cupSize = "AA";
       else if (chestNum <= 82) data.cupSize = "A";
       else if (chestNum <= 85) data.cupSize = "B";
       else if (chestNum <= 89) data.cupSize = "C";
       else if (chestNum <= 93) data.cupSize = "D";
       else if (chestNum <= 97) data.cupSize = "E";
       else if (chestNum <= 101) data.cupSize = "F";
       else if (chestNum <= 105) data.cupSize = "G";
       else if (chestNum <= 109) data.cupSize = "H";
       else if (chestNum <= 113) data.cupSize = "I";
       else if (chestNum <= 117) data.cupSize = "J";
       else if (chestNum <= 121) data.cupSize = "K";
       else if (chestNum <= 125) data.cupSize = "L";
       else if (chestNum <= 129) data.cupSize = "M";
       else data.cupSize = "N";
     }
  }

  return data;
};
