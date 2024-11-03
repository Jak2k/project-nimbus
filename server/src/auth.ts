import { encodeHex } from "jsr:@std/encoding/hex";

type Teacher = {
  name: string;
  passwordHash: string;
  analyticsConsent: boolean;
};

export async function getTeachers(): Promise<Teacher[]> {
  if (!(await Deno.stat(".data").catch(() => false))) {
    await Deno.mkdir(".data");
  }
  if (!(await Deno.stat(".data/teachers.csv").catch(() => false))) {
    Deno.writeTextFile(
      ".data/teachers.csv",
      "name,passwordHash,analyticsConsent\n"
    );
  }
  const file = await Deno.readTextFile(".data/teachers.csv");
  const lines = file
    .split("\n")
    .filter((line) => line.trim() !== "")
    .slice(1);
  return lines.map((line) => {
    const [name, passwordHash, analyticsConsent] = line.split(",");
    return {
      name,
      passwordHash,
      analyticsConsent: analyticsConsent === "true",
    };
  });
}

export async function validatePassword(
  teacher: Teacher,
  password: string
): Promise<boolean> {
  const messageBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", messageBuffer);
  const hashHex = encodeHex(hashBuffer);
  return hashHex === teacher.passwordHash;
}

if (import.meta.main) {
  console.log(await getTeachers());

  // if first argument is "validate", validate the password
  if (Deno.args[0] === "validate") {
    const teachers = await getTeachers();
    const teacher = teachers.find((t) => t.name === Deno.args[1]);
    if (!teacher) {
      console.error("Teacher not found");
      Deno.exit(1);
    }
    const password = Deno.args[2];
    if (!password) {
      console.error("Password not provided");
      Deno.exit(1);
    }
    console.log("Validating password", password, "for teacher", teacher.name);
    const valid = await validatePassword(teacher, password);
    console.log(valid);
  } else if (Deno.args[0] === "hash") {
    const password = Deno.args[1];
    if (!password) {
      console.error("Password not provided");
      Deno.exit(1);
    }
    const messageBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", messageBuffer);
    const hashHex = encodeHex(hashBuffer);
    console.log(hashHex);
  }
}
