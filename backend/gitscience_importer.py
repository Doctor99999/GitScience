#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
gitscience_importer.py — Автоматический импорт научных статей из мировых баз (arXiv API)
"""

import re
import urllib.request
import xml.etree.ElementTree as ET
import hashlib
from typing import Dict, Any

# Валидный идентификатор arXiv: 2104.08821, 2303.08774v2, math.GT/0309136
_ARXIV_ID_RE = re.compile(r"^([a-z\-]+(\.[A-Z]{2})?/\d{7}|\d{4}\.\d{4,5}(v\d+)?)$")

class GitScienceImporter:
    @staticmethod
    def fetch_arxiv(arxiv_id: str) -> Dict[str, Any]:
        """
        Выкачивает метаданные и аннотацию статьи из arXiv по её ID (например: '2104.08821')
        """
        # Очищаем ID от лишних пробелов или префиксов и строго валидируем (анти-инъекция в query API)
        clean_id = arxiv_id.strip().replace("arXiv:", "").replace("arxiv:", "")
        if not _ARXIV_ID_RE.match(clean_id):
            raise ValueError(f"Невалидный формат arXiv ID: '{clean_id}'")
        url = f"http://export.arxiv.org/api/query?id_list={clean_id}"
        
        # Делаем официальный запрос к серверу Корнеллского университета
        req = urllib.request.Request(url, headers={'User-Agent': 'GitScience/1.0'})
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                xml_data = response.read()
        except Exception as e:
            raise RuntimeError(f"Не удалось связаться с arXiv API: {e}")

        # Разбираем структуру данных (XML)
        root = ET.fromstring(xml_data)
        namespace = {'atom': 'http://www.w3.org/2005/Atom'}
        entry = root.find('atom:entry', namespace)

        if entry is None:
            raise ValueError(f"Статья с ID '{clean_id}' не найдена в мировой базе.")

        # Вытаскиваем нужную нам «выжимку»
        title = entry.find('atom:title', namespace).text.strip().replace('\n', ' ')
        summary = entry.find('atom:summary', namespace).text.strip()
        authors = [author.find('atom:name', namespace).text for author in entry.findall('atom:author', namespace)]
        published = entry.find('atom:published', namespace).text

        # 🚀 МАГИЯ: Автоматически формируем идеальный Markdown-документ
        markdown_content = f"""# {title}

**Авторы:** {', '.join(authors)}  
**Дата публикации:** {published}  
**Идентификатор источника:** arXiv:{clean_id}  
**Статус:** Автоматически импортировано в экосистему GitScience™  

## Аннотация (Abstract)
{summary}
"""
        # Сразу генерируем наш фирменный бронежилет (Prior Art Shield)
        sha256_hash = hashlib.sha256(markdown_content.encode('utf-8')).hexdigest()

        return {
            "title": title,
            "authors": authors,
            "content": markdown_content,
            "sha256": sha256_hash,
            "source": "arXiv",
            "source_id": clean_id,
            "dpid": f"dpid.gitscience.org/{sha256_hash[:12]}"
        }