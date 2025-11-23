import React, { useReducer } from "react";

type FormState<T> = {
  values: T;
  errors: Record<string, string>;
};

type FormAction<T> =
  | { type: "SET_FIELD"; field: keyof T; value: unknown }
  | { type: "CLEAR_ERROR"; field: keyof T }
  | { type: "SET_ERRORS"; errors: Record<string, string> }
  | { type: "RESET"; initialValues: T };

function formReducer<T>(state: FormState<T>, action: FormAction<T>): FormState<T> {
  switch (action.type) {
    case "SET_FIELD":
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
      };
    case "CLEAR_ERROR": {
      const nextErrors = { ...state.errors };
      delete nextErrors[action.field as string];
      return { ...state, errors: nextErrors };
    }
    case "SET_ERRORS":
      return { ...state, errors: action.errors };
    case "RESET":
      return {
        values: action.initialValues,
        errors: {},
      };
    default:
      return state;
  }
}

export const useFormReducer = <T,>(
  initialValues: T,
): {
  formState: FormState<T>;
  updateFormState: React.Dispatch<FormAction<T>>;
  setField: <K extends keyof T>(field: K, value: T[K]) => void;
} => {
  const [formState, dispatch] = useReducer(formReducer<T>, {
    values: initialValues,
    errors: {},
  });

  const setField = <K extends keyof T>(field: K, value: T[K]): void => {
    // simultaneously update state, and reset any error associated with that state.
    dispatch({ type: "SET_FIELD", field, value });
    dispatch({ type: "CLEAR_ERROR", field });
  };

  return {
    formState,
    updateFormState: dispatch,
    setField,
  };
};
