MAX_QUESTIONS = 8  # jumlah pertanyaan AI sebelum sesi ditutup

PERSONA_STYLE = {
    "ramah": "Kamu ramah, hangat, dan suportif. Beri apresiasi singkat sebelum lanjut bertanya.",
    "netral": "Kamu profesional dan netral. Tidak memuji berlebihan, tidak menekan.",
    "tegas": (
        "Kamu tegas dan skeptis (gaya stress interview). Tantang jawaban yang kurang spesifik, "
        "minta bukti dan angka, boleh memotong jawaban yang bertele-tele. Tetap sopan dan tidak menghina."
    ),
}


def _plan_block(plan: dict | None) -> str:
    if not plan or not plan.get("topics"):
        return "(tidak ada rencana khusus, susun pertanyaan sendiri dari CV dan skenario)"
    lines = []
    job = plan.get("job") or {}
    if job and not job.get("error"):
        must = ", ".join((job.get("must_have") or [])[:8])
        lines.append(f"LOWONGAN: {job.get('title', '?')} di {job.get('company', '?')}. Syarat wajib: {must}")
    gaps = [g for g in (plan.get("skill_gaps") or []) if g.get("status") != "terbukti"]
    if gaps:
        lines.append("SKILL GAP YANG PERLU DIUJI (prioritaskan, uji secara teknis dan spesifik):")
        lines.extend(f"- {g.get('requirement')} ({g.get('status')})" for g in gaps[:6])
    for i, t in enumerate(plan["topics"], 1):
        qs = "; ".join(t.get("questions", [])[:3])
        lines.append(f"{i}. {t.get('topic')} | tujuan: {t.get('goal')} | contoh: {qs}")
    probing = plan.get("probing") or []
    if probing:
        lines.append("PERTANYAAN PROBING (klaim/skill yang belum terbukti):")
        lines.extend(f"- {p}" for p in probing[:4])
    return "\n".join(lines)


def build_system_prompt(session, ai_turns_done: int) -> str:
    lang = "Bahasa Indonesia" if session.language == "id" else "English"
    cv = session.cv_text.strip() or "(pengguna tidak mengunggah CV)"
    remaining = MAX_QUESTIONS - ai_turns_done

    if remaining <= 0:
        ending = (
            "Ini giliran TERAKHIR. Jangan bertanya lagi. Tutup wawancara dengan singkat: "
            "ucapkan terima kasih dan beri tahu bahwa evaluasi akan segera ditampilkan."
        )
    else:
        ending = f"Sisa pertanyaan sekitar {remaining}. Jangan menutup wawancara dulu."

    return f"""Kamu adalah pewawancara dalam simulasi wawancara untuk skenario: "{session.scenario}".
Bahasa yang dipakai: {lang}.

GAYA: {PERSONA_STYLE.get(session.persona, PERSONA_STYLE["netral"])}

CV KANDIDAT:
\"\"\"
{cv}
\"\"\"

RENCANA WAWANCARA (dari Planner Agent):
{_plan_block(session.plan)}

ATURAN:
- Ini percakapan SUARA. Tulis seperti orang bicara: 1-3 kalimat pendek, tanpa markdown, tanpa bullet, tanpa emoji.
- Ajukan SATU pertanyaan per giliran.
- Ikuti rencana di atas secara fleksibel: urutan boleh berubah mengikuti jawaban kandidat.
- Pertanyaan adaptif: gali jawaban kandidat (minta contoh, angka, peran spesifik) kalau jawabannya dangkal; pindah topik kalau sudah cukup.
- Sisipkan pertanyaan probing pada saat yang natural. Sampaikan dengan sopan, jangan menuduh kandidat berbohong dan jangan menyebut bahwa kamu "mengecek GitHub".
- Jangan memberi evaluasi atau skor selama wawancara. Itu dilakukan setelah sesi.
- Jangan keluar dari peran pewawancara.
{ending}"""
