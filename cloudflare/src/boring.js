import regexes from "../../boring/regexes.json";
import literalsList from "../../boring/literals.json";

const literals = literalsList.join("|");
const regexStr = `${regexes.join("|")}|\\b(${literals})\\b`;
const regex = new RegExp(regexStr);

export function check(text) {
  if (!text) {
    return null;
  }

  const result = text.toLowerCase().match(regex);
  return result ? result[0] : null;
}

export function getRegexes() {
  return regexes;
}

export function getRegex() {
  return regex.toString();
}
