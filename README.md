# Engineering Toolkit Pro

follow the instructions carefully and build according to the instructions perfectly with nice UI/UX designs, animations and functionality, make sure every single feature in the instructions is built and working properly , all buttons must also work well. If u need any thing or further info for me too u can ask. Finally the part that does not involve the building but more like question and anwser too , make sure to do it and provide the word doc instead of pdf for me to download . Now the INSTRUCTIONS : Capstone · 20 marks

Capstone Project — Full Engineering Application

The crown of PE 262: build, deploy, and present a complete engineering software tool that uses every skill from the course

The Capstone Challenge

You will build a complete, deployed, professional-quality engineering web application. It must be something genuinely useful — a tool you would be proud to show a potential employer. It integrates everything from this course: computational thinking, Python, data analysis, OOP, AI assistance, and Streamlit deployment.

The Application: Fluid Flow & Heat Transfer Engineering Suite

Build a multi-page Streamlit application with the following modules. You may use AI tools to assist, but every line of code must be understood, verified, and documented by you.

Module APipe Flow Analyser5 marks

A complete pipe flow calculator with: fluid selection (water, air, crude oil, user-defined) with properties auto-populated; inputs for pipe geometry (D, L, roughness) and flow rate; display of velocity, Re, friction factor, pressure drop; interactive plot of pressure drop vs flow rate over a range; export results to CSV.

(2 marks) Correct calculations verified against hand-calculated examples

(2 marks) Professional UI with sidebar inputs, metric displays, and plot

(1 mark) CSV export functionality working correctly

Module BHeat Transfer Calculator5 marks

Calculates: (1) steady-state conduction through a flat wall (Fourier’s law, single layer); (2) Newton’s Law of Cooling: time to cool from T0 to Ttarget in ambient Tinf; (3) plots temperature vs time for the cooling process. Inputs clearly explained with physical descriptions, not just variable names.

(2 marks) Both calculations correct, verified against analytical solutions

(2 marks) Interactive cooling curve plot updates in real time with slider inputs

(1 mark) Physical descriptions and unit guidance for all inputs

Module CRock & Fluid Data Dashboard5 marks

Load a user-uploaded CSV of rock or fluid data; display summary statistics; allow filtering (e.g., show only samples where porosity > X%); produce two charts (e.g., porosity histogram and porosity-permeability crossplot); download filtered data as CSV.

(2 marks) File upload, loading, and display working correctly

(2 marks) Filtering and both charts correct and well-formatted

(1 mark) Download button produces valid CSV

Module DCode Quality & Deployment5 marks

(1 mark) Code uses OOP: at least one class (e.g., Fluid, Pipe, or HeatExchanger) imported from a separate engineering.py module.

(1 mark) All functions have docstrings. Error handling prevents crashes on bad input.

(1 mark) Git repository with at least 5 meaningful commits. README with description and live URL.

(1 mark) App is deployed and publicly accessible on Streamlit Community Cloud.

(1 mark) AI usage documented: 3 prompts listed, what was verified, what was corrected.

Submission

Submit: (1) GitHub repository URL; (2) Live Streamlit app URL; (3) a 1-page PDF "developer report" explaining one interesting engineering insight your app reveals, one technical challenge you overcame, and one thing you would add if you had more time. Due: 2 weeks after Week 8 lecture.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://thermal-flux.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b529d93e-a033-4f34-9170-0359b698735c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
