export const AI_TASKS=Object.freeze({IMPAR_ANALYSIS:'IMPAR_ANALYSIS'});
export const assertTask=task=>{if(task!==AI_TASKS.IMPAR_ANALYSIS)throw Object.assign(new Error('TASK_NOT_AVAILABLE'),{code:'TASK_NOT_AVAILABLE'});return task;};
