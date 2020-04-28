export function getErrorMessage(error){
  try {
    let j = JSON.parse(error.message.substr(16, error.message.length-15));
    return j.message;
  } catch (e) {
    return "Unable to read error message.";
  }
}