import { DB } from "./types";
const ex = (name: string, primary: string, equipment = "") => ({ name, primary, equipment });
export const seed: DB = {
  // Neutral placeholder values (NOT real data). Each user sets their own in Settings > Edit Profile.
  profile: { name: "", dob: "1990-01-01", heightCm: 170, startKg: 70, goalKg: 65 },
  settings: { bottleL: 1, bottleTarget: 4, units: "kg", scheduleV: 1, sundayRestFrom: "2024-01-01" /* = CYCLE_START in lib/util.ts */ },
  weight: [], waist: [], food: [], foodLib: [], water: {}, workouts: [], supplements: {},
  exercises: [
    ex("Bench Press","Chest","Flat bench + plates"),ex("Incline Bench Press","Chest","Incline bench + plates"),ex("Decline Bench Press","Chest","Decline bench + plates"),ex("Chest Fly Machine","Chest","Chest fly machine"),ex("T-Bar Row","Back","T-bar row machine"),ex("Lateral Row Machine","Back","Lateral rowing machine"),ex("Seated Leg Curl","Hamstrings","Seated leg curl machine"),ex("Hip Abduction","Glutes","Hip abduction machine"),ex("Hip Adduction","Adductors","Hip adduction machine"),ex("Two-way Squat Machine","Quads","Two-way squat machine"),ex("Wrist Curl","Forearms","Dumbbell / bench"),ex("Treadmill","Cardio","Treadmill"),ex("Cycling","Cardio","Cycling bike"),ex("Chest Press","Chest","Chest press machine"),ex("Incline Dumbbell Press","Chest","Dumbbell"),ex("Cable Fly","Chest","Cable"),
    ex("Lat Pulldown","Back","Cable"),ex("Close-Grip Pulldown","Back","Cable"),ex("Seated Row","Back","Cable"),ex("One Arm Row","Back","Dumbbell"),ex("Shoulder Press","Shoulders","Machine"),
    ex("Lateral Raise","Shoulders","Dumbbell"),ex("Rear Delt Fly","Rear delts","Machine"),ex("Biceps Curl","Biceps","Dumbbell"),ex("Hammer Curl","Biceps","Dumbbell"),
    ex("Triceps Pushdown","Triceps","Cable"),ex("Overhead Triceps Extension","Triceps","Cable"),ex("Leg Press","Quads","45-degree leg press"),ex("Leg Extension","Quads","Machine"),
    ex("Leg Curl","Hamstrings","Machine"),ex("Romanian Deadlift","Hamstrings","Barbell"),ex("Calf Raise","Calves","Machine"),ex("Abdominal Crunch","Abs","Machine"),ex("Leg Raise","Abs","Bodyweight"),
  ],
  // Repeating 7-day cycle. Counts per muscle group follow the Shadow Fitness chart; exercises are reused from the library above.
  program: [
    { day: "Hybrid Push", exercises: ["Bench Press","Chest Press","Cable Fly","Shoulder Press","Lateral Raise","Biceps Curl","Hammer Curl"] },
    { day: "Hybrid Pull", exercises: ["T-Bar Row","Seated Row","Lat Pulldown","Close-Grip Pulldown","Rear Delt Fly","Triceps Pushdown","Overhead Triceps Extension"] },
    { day: "Quad-Focused Legs", exercises: ["Leg Press","Leg Extension","Two-way Squat Machine","Leg Curl","Calf Raise"] },
    { day: "Rest", exercises: [] },
    { day: "Upper Body", exercises: ["Incline Dumbbell Press","Chest Press","Seated Row","One Arm Row","Shoulder Press","Lateral Raise","Rear Delt Fly","Triceps Pushdown","Overhead Triceps Extension","Hammer Curl"] },
    { day: "Glute & Hamstring-Focused Legs", exercises: ["Leg Press","Two-way Squat Machine","Romanian Deadlift","Seated Leg Curl","Hip Abduction","Abdominal Crunch","Leg Raise"] },
    { day: "Rest", exercises: [] },
  ],
};
