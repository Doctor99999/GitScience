#!/usr/bin/env python3
# -*- coding: utf-8 -*-
""" gitscience_privacy.py — Анонимизация данных пациентов (NER/Regex) """
import re

class PrivacyAnonymizer:
    @staticmethod
    def anonymize_text(text: str) -> str:
        text = re.sub(r'\b\d{12}\b', '[ИИН_СКРЫТ]', text)
        text = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '[EMAIL_СКРЫТ]', text)
        text = re.sub(r'\+?\d[\d\s\-\(\)]{8,}\d', '[ТЕЛЕФОН_СКРЫТ]', text)
        return text