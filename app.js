(() => {
  const $ = (id) => document.getElementById(id);
  const all = (selector) => [...document.querySelectorAll(selector)];
  const state = { lastValid: false };
  const num = (id) => {
    const el = $(id);
    if (!el || el.value.trim() === "") return null;
    const n = Number(el.value);
    return Number.isFinite(n) ? n : null;
  };
  const sex = () => document.querySelector('input[name="sex"]:checked').value;
  const unit = () => document.querySelector('input[name="unit"]:checked').value;
  const goal = () => document.querySelector('input[name="goal"]:checked').value;
  const fmt = (n, digits = 1) =>
    Number.isFinite(n)
      ? n.toLocaleString("vi-VN", {
          maximumFractionDigits: digits,
          minimumFractionDigits: digits,
        })
      : "—";
  const round = (n) => Math.round(n);
  const kg = () => {
    const w = num("w");
    return w === null ? null : unit() === "imp" ? w * 0.45359237 : w;
  };
  const cm = () => {
    const h = num("h");
    return h === null ? null : unit() === "imp" ? h * 2.54 : h;
  };
  const cmInput = (id) => {
    const n = num(id);
    return n === null ? null : unit() === "imp" ? n * 2.54 : n;
  };
  const inch = (v) => v / 2.54;
  const validProfile = () => {
    const age = num("age"),
      h = cm(),
      w = kg();
    if (age === null || h === null || w === null)
      return {
        ok: false,
        msg: "Hãy nhập tuổi, chiều cao và cân nặng trước nhé.",
      };
    if (age < 1 || age > 110 || h < 50 || h > 250 || w < 10 || w > 400)
      return { ok: false, msg: "Kiểm tra lại tuổi, chiều cao hoặc cân nặng." };
    return { ok: true, age, h, w };
  };
  function bodyFatNavy(p) {
    const neck = cmInput("neck"),
      waist = cmInput("waist"),
      hip = cmInput("hip");
    if (neck === null || waist === null) return null;
    const h = inch(p.h),
      n = inch(neck),
      wa = inch(waist);
    let bf;
    if (sex() === "m") {
      if (wa <= n || n <= 0)
        return {
          error: "Vòng eo nam cần lớn hơn vòng cổ để dùng công thức này.",
        };
      bf = 86.01 * Math.log10(wa - n) - 70.041 * Math.log10(h) + 36.76;
    } else {
      if (hip === null) return null;
      if (wa + inch(hip) <= n)
        return { error: "Kiểm tra lại số đo eo, mông và cổ." };
      bf =
        163.205 * Math.log10(wa + inch(hip) - n) -
        97.684 * Math.log10(h) -
        78.387;
    }
    return Number.isFinite(bf) && bf >= 2 && bf <= 70
      ? Math.max(2, Math.min(70, bf))
      : {
          error: "Số đo tạo ra kết quả ngoài phạm vi hợp lý. Hãy kiểm tra lại.",
        };
  }
  function bodyFatJP(p) {
    const a = num("sf1"),
      b = num("sf2"),
      c = num("sf3");
    if (a === null || b === null || c === null) return null;
    if (a <= 0 || b <= 0 || c <= 0)
      return { error: "Các nếp gấp da phải lớn hơn 0 mm." };
    const sum = a + b + c,
      age = p.age;
    let density;
    if (sex() === "m")
      density =
        1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * age;
    else
      density =
        1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * age;
    const bf = 495 / density - 450;
    return Number.isFinite(bf) && bf >= 2 && bf <= 70
      ? Math.max(2, Math.min(70, bf))
      : { error: "Kết quả ngoài phạm vi hợp lý. Hãy kiểm tra lại số đo." };
  }
  function getBF(p) {
    const navy = bodyFatNavy(p),
      jp = bodyFatJP(p);
    const vals = [navy, jp].filter((x) => typeof x === "number");
    return {
      navy,
      jp,
      bf: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null,
      count: vals.length,
    };
  }
  function bmiClass(bmi) {
    if (bmi < 18.5) return "Thiếu cân";
    if (bmi < 23) return "Bình thường · chuẩn châu Á";
    if (bmi < 25) return "Thừa cân · chuẩn châu Á";
    if (bmi < 30) return "Béo phì · chuẩn châu Á";
    return "Béo phì mức cao · chuẩn châu Á";
  }
  function bmrCalc(p, bf) {
    const formula = $("bmrf").value;
    if (formula === "katch") {
      if (bf === null) return null;
      return 370 + 21.6 * (p.w * (1 - bf / 100));
    }
    if (formula === "harris") {
      return sex() === "m"
        ? 88.362 + 13.397 * p.w + 4.799 * p.h - 5.677 * p.age
        : 447.593 + 9.247 * p.w + 3.098 * p.h - 4.33 * p.age;
    }
    return 10 * p.w + 6.25 * p.h - 5 * p.age + (sex() === "m" ? 5 : -161);
  }
  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
  }
  function setText(id, text) {
    $(id).textContent = text;
  }
  function updateUnitLabels() {
    const imp = unit() === "imp";
    all(".uL").forEach((el) => (el.textContent = imp ? "in" : "cm"));
    all(".uW").forEach((el) => (el.textContent = imp ? "lb" : "kg"));
    $("h").placeholder = imp ? "68" : "173";
    $("w").placeholder = imp ? "150" : "68";
    $("hipWrap").hidden = sex() !== "f";
    if (sex() === "m") {
      setText("sl1", "Ngực");
      setText("sl2", "Bụng");
      setText("sl3", "Đùi");
    } else {
      setText("sl1", "Cơ tam đầu");
      setText("sl2", "Mào chậu");
      setText("sl3", "Đùi");
    }
  }
  function updateResults(showErrors = false) {
    const pcheck = validProfile();
    if (!pcheck.ok) {
      if (showErrors) showToast(pcheck.msg);
      [
        "bmiValue",
        "bmiLarge",
        "bmiStatus",
        "bmiCategory",
        "bfValue",
        "tdeeValue",
        "tdeeLarge",
        "bmrValue",
        "goalCalories",
        "fatKg",
        "leanKg",
        "leanPct",
        "proteinG",
        "carbG",
        "fatG",
      ].forEach((id) => setText(id, "—"));
      setText("tipTitle", "Bắt đầu từ dữ liệu");
      setText(
        "tipText",
        "Nhập tuổi, chiều cao và cân nặng để nhận phân tích cá nhân hóa.",
      );
      setText("r-navy", "—");
      setText("r-jp", "—");
      $("comparison").innerHTML =
        '<p class="muted">Nhập số đo của một hoặc nhiều phương pháp để so sánh.</p>';
      $("bmiTrack").style.width = "0%";
      $("bfTrack").style.width = "0%";
      $("tdeeTrack").style.width = "0%";
      $("bmiMarker").style.left = "0%";
      $("compositionDonut").style.background =
        "conic-gradient(var(--cyan) 0 70%,#2b2e43 70% 100%)";
      return;
    }
    const p = pcheck,
      bmi = p.w / (p.h / 100) ** 2,
      bfs = getBF(p);
    const bf = bfs.bf,
      bmr = bmrCalc(p, bf),
      tdee = bmr === null ? null : bmr * Number($("act").value);
    setText("bmiValue", fmt(bmi));
    setText("bmiLarge", fmt(bmi));
    setText("bmiStatus", bmiClass(bmi));
    setText("bmiCategory", bmiClass(bmi));
    $("bmiTrack").style.width = Math.min(100, (bmi / 40) * 100) + "%";
    $("bmiMarker").style.left =
      Math.min(98, Math.max(0, (bmi / 40) * 100)) + "%";
    if (bf !== null) {
      setText("bfValue", fmt(bf));
      setText(
        "bfStatus",
        bfs.count === 2 ? "Trung bình 2 phương pháp" : "Ước tính từ số đo",
      );
      $("bfTrack").style.width = Math.min(100, (bf / 50) * 100) + "%";
      const fatMass = (p.w * bf) / 100,
        lean = p.w - fatMass;
      setText("fatKg", fmt(fatMass) + " kg");
      setText("leanKg", fmt(lean) + " kg");
      setText("leanPct", fmt(100 - bf, 0) + "%");
      $("compositionDonut").style.background =
        `conic-gradient(var(--purple) 0 ${bf}%,var(--cyan) ${bf}% 100%)`;
    } else {
      setText("bfValue", "—");
      setText("bfStatus", "Nhập số đo ở tab Chỉ số cơ thể");
      setText("fatKg", "—");
      setText("leanKg", "—");
      setText("leanPct", "—");
      $("compositionDonut").style.background =
        "conic-gradient(var(--cyan) 0 70%,#2b2e43 70% 100%)";
    }
    setText(
      "tdeeValue",
      tdee === null ? "—" : round(tdee).toLocaleString("vi-VN"),
    );
    setText(
      "tdeeLarge",
      tdee === null ? "—" : round(tdee).toLocaleString("vi-VN"),
    );
    setText(
      "bmrValue",
      bmr === null ? "— kcal" : round(bmr).toLocaleString("vi-VN") + " kcal",
    );
    const goalCal =
      tdee === null
        ? null
        : tdee + (goal() === "lose" ? -300 : goal() === "gain" ? 200 : 0);
    setText(
      "goalCalories",
      goalCal === null
        ? "— kcal"
        : round(goalCal).toLocaleString("vi-VN") + " kcal",
    );
    $("tdeeTrack").style.width =
      tdee === null ? "0%" : Math.min(100, (tdee / 3500) * 100) + "%";
    if (goalCal !== null) {
      setText("proteinG", Math.round((goalCal * 0.25) / 4) + " g");
      setText("carbG", Math.round((goalCal * 0.45) / 4) + " g");
      setText("fatG", Math.round((goalCal * 0.3) / 9) + " g");
    } else {
      setText("proteinG", "— g");
      setText("carbG", "— g");
      setText("fatG", "— g");
    }
    const navy = bfs.navy,
      jp = bfs.jp;
    setText(
      "r-navy",
      typeof navy === "number"
        ? fmt(navy) + "%"
        : navy?.error
          ? "Kiểm tra số đo"
          : "—",
    );
    setText(
      "r-jp",
      typeof jp === "number"
        ? fmt(jp) + "%"
        : jp?.error
          ? "Kiểm tra số đo"
          : "—",
    );
    const rows = [];
    if (typeof navy === "number") rows.push(["US Navy", navy]);
    if (typeof jp === "number") rows.push(["Jackson–Pollock", jp]);
    $("comparison").innerHTML = rows.length
      ? rows
          .map(
            ([name, val]) =>
              `<div class="compare-row"><span>${name}</span><b>${fmt(val)}%</b></div>`,
          )
          .join("")
      : '<p class="muted">Nhập đủ số đo để hiện kết quả so sánh.</p>';
    if (goal() === "lose") {
      setText("tipTitle", "Tập trung vào thói quen bền vững");
      setText(
        "tipText",
        "Nếu mục tiêu là giảm mỡ, hãy ưu tiên bữa ăn đủ chất, vận động đều và theo dõi xu hướng qua vài tuần thay vì phản ứng với từng ngày.",
      );
    } else if (goal() === "gain") {
      setText("tipTitle", "Xây dựng tiến bộ từ từ");
      setText(
        "tipText",
        "Kết hợp tập kháng lực phù hợp, ăn đủ chất và nghỉ ngơi. Tăng cân không đồng nghĩa hoàn toàn với tăng cơ.",
      );
    } else {
      setText("tipTitle", "Giữ nhịp độ ổn định");
      setText(
        "tipText",
        "Duy trì vận động, ăn đa dạng và ngủ đủ. Các chỉ số là điểm tham khảo, không phải thước đo duy nhất của sức khỏe.",
      );
    }
    if (showErrors) showToast("Đã cập nhật các chỉ số của bạn.");
  }
  function resetAll() {
    all('input[type="number"]').forEach((el) => (el.value = ""));
    document.querySelector('input[name="sex"][value="m"]').checked = true;
    document.querySelector('input[name="unit"][value="metric"]').checked = true;
    document.querySelector('input[name="goal"][value="maintain"]').checked =
      true;
    $("act").value = "1.375";
    $("bmrf").value = "mifflin";
    updateUnitLabels();
    updateResults(false);
    showToast("Đã xóa dữ liệu nhập.");
  }
  document.querySelectorAll('input[name="sex"]').forEach((el) =>
    el.addEventListener("change", () => {
      updateUnitLabels();
      updateResults(false);
    }),
  );
  document.querySelectorAll('input[name="unit"]').forEach((el) =>
    el.addEventListener("change", () => {
      const nextUnit = unit();
      const prevUnit = nextUnit === "metric" ? "imp" : "metric";
      const ids = ["h", "w", "neck", "waist", "hip"];
      ids.forEach((id) => {
        const el = $(id);
        if (!el || el.value.trim() === "") return;
        const value = Number(el.value);
        if (!Number.isFinite(value)) return;
        const isWeight = id === "w";
        const factor = isWeight
          ? prevUnit === "metric"
            ? 1 / 0.45359237
            : 0.45359237
          : prevUnit === "metric"
            ? 1 / 2.54
            : 2.54;
        el.value = String(Math.round(value * factor * 10) / 10);
      });
      updateUnitLabels();
      updateResults(false);
    }),
  );
  all('input[name="goal"]').forEach((el) =>
    el.addEventListener("change", () => updateResults(false)),
  );
  all("input,select").forEach((el) =>
    el.addEventListener("input", () => updateResults(false)),
  );
 
  $("resetBtn").addEventListener("click", resetAll);
  all(".tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      all(".tab").forEach((t) => t.classList.toggle("active", t === tab));
      all(".section-view").forEach((v) =>
        v.classList.toggle("active", v.id === "view-" + tab.dataset.tab),
      );
    }),
  );
  updateUnitLabels();
  updateResults(false);
})();
