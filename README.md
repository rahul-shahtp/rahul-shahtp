<div align="center">

<img src="assets/banner.svg" width="100%" alt="RISC-V • ASIC • AI Banner"/>

<br/>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&duration=2500&pause=800&color=7C3AED&center=true&vCenter=true&multiline=true&repeat=true&width=580&height=90&lines=Building+RISC-V+Processors+%26+ASIC+Flows;Open+Source+Hardware+Enthusiast;Hardware-AI+Co-design+Explorer" alt="Typing SVG" />

<br/>

![B.Tech ECE](https://img.shields.io/badge/B.Tech%20ECE-USICT%20GGSIPU-7C3AED?style=flat-square&labelColor=0f172a)
![Specialization](https://img.shields.io/badge/Specialization-VLSI%20%26%20Digital%20Design-6D28D9?style=flat-square&labelColor=0f172a)
![Location](https://img.shields.io/badge/Location-Delhi%2C%20India-4F46E5?style=flat-square&labelColor=0f172a&logo=googlemaps&logoColor=white)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-rahul--shahtp-0A66C2?style=flat-square&labelColor=0f172a)](https://linkedin.com/in/rahul-shah-510a05321)
[![Email](https://img.shields.io/badge/Email-thanda%40opencores.org-EA580C?style=flat-square&labelColor=0f172a)](mailto:thanda@opencores.org)
[![GitHub](https://img.shields.io/badge/GitHub-rahul--shahtp-ffffff?style=flat-square&labelColor=0f172a)](https://github.com/rahul-shahtp)
</div>

---

## About Me

```yaml
name: "Rahul Shah"
alias: "Thanda"
education: "B.Tech ECE, USICT GGSIPU Delhi (2024–2028)"
specialization: "VLSI & Hardware Design + AI elective"
focus:
  - "RISC-V Processor Architecture & Design"
  - "ASIC Physical Design (RTL→GDS)"
  - "Digital Design & Verification"
  - "FPGA Prototyping"
  - "Hardware-AI Co-design"
target: "EDA/VLSI Internships (Cadence, Synopsys, Arm)"
philosophy: "A processor that computes 2 + 2 = 5 is just a heater."
```

**Open To:** VLSI Internships · RTL Design · Verification · Physical Design · Hardware-AI Co-design

---

## Tech Stack

<div align="center">

### HDL & Languages
![Verilog](https://img.shields.io/badge/Verilog-010101?style=for-the-badge&logo=verilog&logoColor=white)
![SystemVerilog](https://img.shields.io/badge/SystemVerilog-010101?style=for-the-badge&logo=verilog&logoColor=white)
![C](https://img.shields.io/badge/C-A8B9CC?style=for-the-badge&logo=c&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

### EDA Toolchain
![Yosys](https://img.shields.io/badge/Yosys-FF6600?style=for-the-badge&labelColor=0f172a)
![OpenROAD](https://img.shields.io/badge/OpenROAD-00BFFF?style=for-the-badge&labelColor=0f172a)
![OpenLane](https://img.shields.io/badge/OpenLane-FF4500?style=for-the-badge&labelColor=0f172a)
![Magic VLSI](https://img.shields.io/badge/Magic%20VLSI-32CD32?style=for-the-badge&labelColor=0f172a)
![KLayout](https://img.shields.io/badge/KLayout-0078D4?style=for-the-badge&labelColor=0f172a)
![Icarus Verilog](https://img.shields.io/badge/Icarus%20Verilog-FF6600?style=for-the-badge&labelColor=0f172a)
![GTKWave](https://img.shields.io/badge/GTKWave-4B0082?style=for-the-badge&labelColor=0f172a)
![Vivado](https://img.shields.io/badge/Vivado-2025.2-000000?style=for-the-badge&labelColor=0f172a)

### PDKs & Platforms
![Sky130](https://img.shields.io/badge/SkyWater%20SKY130-0096D9?style=for-the-badge&labelColor=0f172a)
![OpenCores](https://img.shields.io/badge/OpenCores-thanda-4169E1?style=for-the-badge&labelColor=0f172a)

### OS & Tooling
![Ubuntu](https://img.shields.io/badge/Ubuntu-E95420?style=for-the-badge&logo=ubuntu&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)

</div>

---

## Featured Projects

<details open>
<summary><b>⚡ Pipelined 32-bit RISC-V RV32IM Processor</b></summary>

<br/>

| Aspect | Details |
|--------|---------|
| **Stack** | Verilog · SystemVerilog · Icarus Verilog · Vivado XSim |
| **Architecture** | 22 modules · 5-stage pipeline · RV32IM (M-ext) |
| **Features** | ALU forwarding (A/B) · Hazard detection · LB/LH/LBU/LHU/SB/SH |
| **Verification** | 16-test regression suite · Load-use stalls · Control flushes |
| **Status** | ✅ All tests pass in Vivado XSim |

Complete RTL implementation of a 5-stage pipelined RISC-V processor with multiply/divide extension and byte/halfword memory ops. Chosen over CSIR NPL Delhi opportunity for stronger EDA internship profile. Foundation for AI accelerator integration.

[Repository](https://github.com/rahul-shahtp/Pipelined-32-bit-RISCV-processor)

</details>

<details>
<summary><b>🚦 Traffic Light Controller — RTL-to-GDS (Clean Tapeout)</b></summary>

<br/>

| Aspect | Details |
|--------|---------|
| **Stack** | Verilog · OpenLane v1.0.2 · Yosys · KLayout · Netgen |
| **Flow** | Full ASIC · SkyWater SKY130A |
| **Verification** | ✅ Zero DRC violations · ✅ Zero LVS violations |
| **Logic** | FSM-based · Sensor-driven highway-road intersection |
| **Status** | First clean tapeout · Documented on LinkedIn |

End-to-end RTL-to-GDS implementation through the open-source ASIC flow. First project to achieve zero DRC/LVS violations — milestone in open-source hardware journey.

[Repository](https://github.com/rahul-shahtp/Traffic-Light-Controller---RTL-to-GDS)

</details>

<details>
<summary><b>🔧 Single-Cycle RV32I Processor</b></summary>

<br/>

| Aspect | Details |
|--------|---------|
| **Stack** | Verilog · Yosys · OpenROAD · Sky130 PDK |
| **Architecture** | 10 modules · 20 instructions · RV32I base ISA |
| **Physical** | ~69K Sky130 cells · 0.82 mm² · DRT-0305 routing challenge |
| **Status** | RTL clean · PnR routing error on power nets (learning) |

32-bit single-cycle RISC-V with full datapath and control unit. Synthesized and physically designed on Sky130A via OpenROAD. The DRT-0305 error on `lpflow_isobufsrc` power nets was a critical lesson in ASIC power grid design.

[Repository](https://github.com/rahul-shahtp/Single-cycle-RISC-V)

</details>

<details>
<summary><b>🧠 AI Accelerator — Systolic Array MAC (Research)</b></summary>

<br/>

| Aspect | Details |
|--------|---------|
| **Architecture** | Memory-mapped systolic array coprocessor on RV32I |
| **Target** | Matrix multiply via parallel MAC operations |
| **Interface** | CPU accesses via memory-mapped addresses |
| **Research** | TPU · Eyeriss · Gemmini · Transformers ("Attention Is All You Need") |
| **Status** | Architecture design phase · Reading list compiled |

Long-term vision: integrate AI inference accelerator with the RV32I pipeline core for edge AI workloads.

</details>

---

## Experience

<div align="center">

| Role | Organization | Period |
|------|-------------|--------|
| **B.Tech ECE (VLSI + AI)** | USICT, GGSIPU Delhi | 2024 – Present |
| **Open Source Contributor** | OpenCores (`shahrahul@opencores.org`) | 2026 – Present |
| **Hardware-AI Research** | Self-directed | 2026 – Present |

</div>

---

## Key Achievements

<div align="center">

| Achievement | Details |
|-------------|---------|
| 🏆 **Clean Tapeout** | TLC RTL→GDS: Zero DRC/LVS on Sky130A |
| 🏆 **RV32IM Pipeline** | 22-module · 5-stage · 16/16 tests passing |
| 🏆 **HDLBits** | FSM, shift registers, PS/2 scancode debugging |

</div>

---



---

</div>

---

## Current Focus

```yaml
learning:
  - "AI Accelerator Architectures (TPU, Eyeriss, Gemmini)"
  - "Advanced ASIC Physical Design"
  - "RISC-V Custom Extensions"
building:
  - "AI Accelerator on RV32I Pipeline"
  - "Systolic Array MAC Coprocessor"
  - "Open Source Hardware Contributions"
exploring:
  - "Hardware-AI Co-design Patterns"
  - "FPGA Prototyping for AI"
  - "ML-Driven EDA Optimization"
open_to:
  - "VLSI Internships (Cadence, Synopsys, Arm)"
  - "RTL Design & Verification"
  - "Physical Design"
  - "Hardware-AI Co-design"
```

---

## Connect

<div align="center">

[![Gmail](https://img.shields.io/badge/Gmail-EA580C?style=for-the-badge&logo=gmail&logoColor=white)](mailto:thanda@opencores.org)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/rahul-shah-510a05321)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/rahul-shahtp)
[![Portfolio](https://img.shields.io/badge/Portfolio-22c55e?style=for-the-badge&logo=vercel&logoColor=white)](https://rahulshah.tech)

</div>

---

<div align="center">

*"A processor that computes 2 + 2 = 5 is just a heater."*

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=100&section=footer" width="100%"/>

</div>
