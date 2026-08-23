# -*- coding: utf-8 -*-
"""
gitscience_fhir.py — Clinical HL7/FHIR R4 & DICOM Gateway
Обеспечивает интеграцию GitScience™ MaaS с госпитальными информационными системами (МИС/PACS):
DamuMed, Epic, Cerner, Meditech.
Стандарты: HL7 FHIR R4, DICOM PS3.18 Web, LOINC, SNOMED-CT, RUO Class I.
"""
import uuid
import time
from typing import Dict, Any, List, Optional
import gitscience_compiler as compiler

LOINC_CODES = {
    "Artery": {"code": "8480-6", "display": "Systolic blood pressure / Arterial Axis", "unit": "mmHg"},
    "Vein": {"code": "8462-4", "display": "Diastolic blood pressure / Venous Axis", "unit": "mmHg"},
    "Lymph": {"code": "26464-8", "display": "Leukocytes / Lymphatic Axis Flow", "unit": "10*3/uL"},
    "Tk_Homeostasis": {"code": "98432-1", "display": "GitScience Tk Homeostasis Index", "unit": "index"}
}

class ClinicalFHIRGateway:
    """Шлюз интероперабельности клинических данных FHIR R4"""

    @classmethod
    def create_observation_resource(
        cls,
        patient_id: str,
        param_name: str,
        value: float,
        unit: str,
        loinc_code: str,
        display: str
    ) -> Dict[str, Any]:
        return {
            "resourceType": "Observation",
            "id": f"obs-{uuid.uuid4().hex[:8]}",
            "status": "final",
            "category": [{
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                    "code": "vital-signs",
                    "display": "Vital Signs"
                }]
            }],
            "code": {
                "coding": [{
                    "system": "http://loinc.org",
                    "code": loinc_code,
                    "display": display
                }],
                "text": display
            },
            "subject": {
                "reference": f"Patient/{patient_id}"
            },
            "effectiveDateTime": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "valueQuantity": {
                "value": round(value, 4),
                "unit": unit,
                "system": "http://unitsofmeasure.org",
                "code": unit
            }
        }

    @classmethod
    def execute_fhir_bundle_calculation(
        cls,
        patient_id: str,
        formula_math: str,
        artery_val: float,
        vein_val: float,
        lymph_val: float
    ) -> Dict[str, Any]:
        """
        Принимает клинические наблюдения FHIR, исполняет формулу в Safe AST
        и возвращает валидный FHIR R4 Bundle с результатом расчета гомеостаза.
        """
        variables = {"Artery": artery_val, "Vein": vein_val, "Lymph": lymph_val}
        tk_result = compiler.execute_formula(formula_math, variables)

        # Генерация входящих и выходящих ресурсов Observation
        obs_artery = cls.create_observation_resource(
            patient_id, "Artery", artery_val, LOINC_CODES["Artery"]["unit"],
            LOINC_CODES["Artery"]["code"], LOINC_CODES["Artery"]["display"]
        )
        obs_vein = cls.create_observation_resource(
            patient_id, "Vein", vein_val, LOINC_CODES["Vein"]["unit"],
            LOINC_CODES["Vein"]["code"], LOINC_CODES["Vein"]["display"]
        )
        obs_lymph = cls.create_observation_resource(
            patient_id, "Lymph", lymph_val, LOINC_CODES["Lymph"]["unit"],
            LOINC_CODES["Lymph"]["code"], LOINC_CODES["Lymph"]["display"]
        )
        obs_tk = cls.create_observation_resource(
            patient_id, "Tk_Homeostasis", tk_result, LOINC_CODES["Tk_Homeostasis"]["unit"],
            LOINC_CODES["Tk_Homeostasis"]["code"], LOINC_CODES["Tk_Homeostasis"]["display"]
        )

        bundle_id = f"bundle-gs-{uuid.uuid4().hex[:8]}"
        bundle = {
            "resourceType": "Bundle",
            "id": bundle_id,
            "type": "transaction-response",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "meta": {
                "profile": ["http://hl7.org/fhir/StructureDefinition/Bundle"],
                "tag": [{
                    "system": "https://gitscience.org/standards/ruo",
                    "code": "CLASS-I-RUO",
                    "display": "Research Use Only Clinical Decision Support"
                }]
            },
            "entry": [
                {"resource": obs_artery},
                {"resource": obs_vein},
                {"resource": obs_lymph},
                {"resource": obs_tk}
            ],
            "gitscience_computation": {
                "formula_math": formula_math,
                "ast_merkle_digest": compiler.compute_ast_merkle_digest(formula_math),
                "tk_homeostasis_output": round(tk_result, 4),
                "execution_engine": "Safe AST Isolated Sandboxed Engine v3.3",
                "regulatory_class": "RUO Class I CDSS"
            }
        }
        return bundle


class DICOMWebGateway:
    """Шлюз метаданных медицинских онкоснимков КТ/МРТ (DICOM PS3.18)"""

    @classmethod
    def simulate_dicom_study_integration(
        cls,
        patient_id: str,
        modality: str = "CT",
        body_part: str = "CHEST_ABDOMEN"
    ) -> Dict[str, Any]:
        study_uid = f"1.2.840.10008.5.1.4.1.1.2.{int(time.time())}.{uuid.uuid4().hex[:6]}"
        series_uid = f"1.2.840.10008.5.1.4.1.1.2.{int(time.time())}.1.{uuid.uuid4().hex[:4]}"
        
        return {
            "status": "DICOM_WADO_RS_ACCESSIBLE",
            "study_instance_uid": study_uid,
            "series_instance_uid": series_uid,
            "patient_id": patient_id,
            "modality": modality,
            "body_part_examined": body_part,
            "oncology_target_segmented": True,
            "vascular_clamping_risk_score": 0.142,
            "wado_uri": f"https://pacs.hospital.org/wado-rs/studies/{study_uid}",
            "gitscience_linked_formula": "(Artery + Vein) / (Lymph + 1.0)",
            "compliance": "DICOM PS3.18 / ISO 12052"
        }
