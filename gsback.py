#!/usr/bin/env python3
"""
gsback.py – Greenseam AI (v7.1, clean names + real exploit bullets)

pip install "openai>=1.3.5" python-dotenv tiktoken rapidfuzz
set OPENAI_API_KEY=sk-...
py gsback.py gc.txt
"""
from __future__ import annotations
import os, sys, json, logging, re, math
from collections import defaultdict
from dotenv import load_dotenv
import openai, tiktoken
from rapidfuzz import process, fuzz, utils

# ── ENV / MODELS ────────────────────────────────────────────────────────────
load_dotenv()
client = openai.OpenAI(
    api_key=os.getenv("OPENAI_API_KEY") or sys.exit("Set OPENAI_API_KEY"))
EXTRACT_MODEL = os.getenv("FINE_TUNE_MODEL", "gpt-3.5-turbo-1106")
BULLET_MODEL  = os.getenv("BULLET_MODEL",  "gpt-3.5-turbo-1106")

TOK_LIMIT, OVERLAP = 6000, 100
DEBUG = os.getenv("GS_DEBUG") == "1"
enc = tiktoken.encoding_for_model("gpt-3.5-turbo")

# ── PROMPTS ─────────────────────────────────────────────────────────────────
PARSE_SYS = """
You are a baseball log parser.
Return ONLY a JSON object:
{ "plays":[
  { "name":"John Adams",
    "result":"Single|Double|Triple|HomeRun|GroundOut|FlyOut|LineOut|Strikeout|Walk|HBP",
    "battedBall":"Ground|Line|Fly|Popup|None" }
]}
One element per plate appearance – no aggregation.  Must be valid JSON.
"""
BULLET_SYS = """
You are Greenseam AI, a data-driven scout.
For each hitter JSON entry:
  • If pa ≥ 15 AND any outcome posterior ≥ 40 %, output
        #<Name>
        Pitching Strategy:
            • <ONE ≤15-word exploit bullet>
  • Else output “#<Name> – no confident exploit.”
Sort by pa descending.  Separate hitters with “⸻”.
Begin now.
"""

# ── NAME FILTER & MERGE ─────────────────────────────────────────────────────
STOP = {"BRDG","FRNT","BRIDGEWATER","FRONT","ROYAL"}
SIM  = 92
def valid_name(n:str)->bool:
    if any(d.isdigit() for d in n):
        return False
    parts = n.strip().split()
    if len(parts) > 2:
        return False
    if any(p.upper() in STOP for p in parts):
        return False
    letters = "".join(c for c in n if c.isalpha())
    return len(letters) >= 2

OUTCOME = {"SINGLE","DOUBLE","TRIPLE","HOMERUN","GROUNDOUT","FLYOUT",
           "LINEOUT","STRIKEOUT","WALK","HBP","OUT"}
def canonical(n:str)->str: return utils.default_process(n)

def merge_names(rows:list[dict]) -> dict[str, list[dict]]:
    merged: dict[str, list[dict]] = {}
    for r in rows:
        raw = r["name"].strip()
        if not valid_name(raw):
            continue
        key = canonical(raw)
        match = process.extractOne(key, merged.keys(),
                                   scorer=fuzz.token_set_ratio)
        if match and match[1] >= SIM:
            merged[match[0]].append(r)
        else:
            merged.setdefault(key, []).append(r)
    return merged

# ── AGGREGATE & POSTERIOR ───────────────────────────────────────────────────
def agg(rows):
    s=dict(pa=0,ab=0,h=0,bb=0,hbp=0,k=0,gb=0,ld=0,fb=0)
    for r in rows:
        res=r["result"]; s["pa"]+=1
        if res not in {"Walk","HBP"}: s["ab"]+=1
        if res in {"Single","Double","Triple","HomeRun"}: s["h"]+=1
        if res=="Walk": s["bb"]+=1
        if res=="HBP": s["hbp"]+=1
        if res=="Strikeout": s["k"]+=1
        bb=r.get("battedBall","None")
        if bb=="Ground": s["gb"]+=1
        elif bb=="Line": s["ld"]+=1
        elif bb=="Fly":  s["fb"]+=1
    return s

def posterior(s):
    counts={"Hit":s['h'],
            "Out":s['ab']-s['h']-s['k'],
            "K":s['k'],
            "Walk":s['bb'],
            "HBP":s['hbp']}
    tot=sum(counts.values())
    post={k:(v+1)/(tot+len(counts)) for k,v in counts.items()}
    best=max(post,key=post.get)
    return best, post[best]

# ── OPENAI JSON extractor ----------------------------------------------------
def split(text,max_tok,overlap):
    toks=enc.encode(text); step=max_tok-overlap
    for i in range(0,len(toks),step):
        yield enc.decode(toks[i:i+max_tok])

def extract_chunk(chunk,retries=3):
    for n in range(retries):
        rsp=client.chat.completions.create(
            model=EXTRACT_MODEL,
            temperature=0,
            response_format={"type":"json_object"},
            messages=[{"role":"system","content":PARSE_SYS},
                      {"role":"user","content":chunk}],
            max_tokens=2048)
        raw=rsp.choices[0].message.content
        if DEBUG: print(f"\n[parse try {n+1}] {raw[:120]}…")
        try:
            return json.loads(raw)["plays"]
        except Exception:
            logging.warning("Invalid JSON (try %d)",n+1)
    raise RuntimeError("❌ Model failed to return valid JSON 3×")

# ── MAIN ---------------------------------------------------------------------
def main():
    if len(sys.argv)<2: sys.exit("py gsback.py gc.txt")
    txt=open(sys.argv[1],encoding='utf-8',errors='ignore').read()

    plays=[]
    for ch in split(txt,TOK_LIMIT,OVERLAP):
        plays.extend(extract_chunk(ch))

    buckets=merge_names(plays)
    stats={k:agg(v) for k,v in buckets.items() if agg(v)['pa']>=3}
    if not stats: sys.exit("No hitters with ≥3 PA parsed.")

    # ─ simple table ─
    print(f"{'Player':<20}{'PA':>4}{'AVG':>6}{'OBP':>6}{'K%':>6}")
    for n,s in sorted(stats.items(), key=lambda i:-i[1]['pa']):
        pa,ab,h,bb,hbp,k = s['pa'],s['ab'],s['h'],s['bb'],s['hbp'],s['k']
        avg=h/ab if ab else 0
        obp=(h+bb+hbp)/pa
        k_pct=k/pa*100
        print(f"{n[:20]:<20}{pa:>4}{avg:>6.3f}{obp:>6.3f}{k_pct:>6.1f}")

    # ─ build JSON for bullet phase ─
    bullet_input={}
    for n,s in stats.items():
        best,conf=posterior(s)
        bullet_input[n]=dict(pa=s['pa'],avg=round(s['h']/s['ab'],3) if s['ab'] else 0,
                             gb=s['gb'],ld=s['ld'],fb=s['fb'],
                             conf=round(conf,4))

    bullets=client.chat.completions.create(
        model=BULLET_MODEL,
        temperature=0.3,
        messages=[
            {"role":"system","content":BULLET_SYS},
            {"role":"user","content":json.dumps(bullet_input)}]
    ).choices[0].message.content.strip()

    print("\n"+bullets+"\n")

if __name__=="__main__":
    logging.getLogger("openai").setLevel(logging.ERROR)
    main()
