export type EditorErrorCode =
  | "auth_required"
  | "owner_required"
  | "bad_request"
  | "stale_plan"
  | "unsafe_plan"
  | "editor_model_missing"
  | "github_unavailable"
  | "editor_unavailable";

const PUBLIC_MESSAGES: Record<EditorErrorCode,string> = {
  auth_required: "צריך להתחבר כדי לערוך את האתר.",
  owner_required: "אין הרשאת עריכת אתר.",
  bad_request: "בקשת העריכה אינה תקינה.",
  stale_plan: "הקבצים השתנו מאז שההצעה הוכנה. צריך להכין אותה מחדש.",
  unsafe_plan: "השינוי המוצע נחסם מטעמי בטיחות.",
  editor_model_missing: "מודל עורך האתר אינו מוגדר כרגע.",
  github_unavailable: "לא ניתן להתחבר כרגע למאגר האתר.",
  editor_unavailable: "עורך האתר אינו זמין כרגע."
};

export class EditorError extends Error {
  code: EditorErrorCode;
  status: number;
  publicMessage: string;

  constructor(code: EditorErrorCode,status=500,message?:string){
    super(message || PUBLIC_MESSAGES[code]);
    this.name="EditorError";
    this.code=code;
    this.status=status;
    this.publicMessage=PUBLIC_MESSAGES[code];
  }
}

export function safeEditorError(error:unknown){
  if(error instanceof EditorError){
    return {status:error.status,body:{code:error.code,error:error.publicMessage}};
  }
  return {status:500,body:{code:"editor_unavailable" as const,error:PUBLIC_MESSAGES.editor_unavailable}};
}
