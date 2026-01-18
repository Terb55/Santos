"""
Benchmark-based price/performance tools for SAM agents.

These tools load local benchmark JSON files and compute performance-per-dollar
rankings for CPUs and GPUs.

Logging Pattern:
    SAM tools use Python's standard logging with a module-level logger.
    Use bracketed identifiers like [BalancePrice:function] for easy filtering.
    Always use exc_info=True when logging exceptions to capture stack traces.
"""

import json
import logging
from pathlib import Path
import re
from typing import Any, Dict, List, Optional

# Module-level logger - SAM will configure this based on your YAML or logging_config.yaml
log = logging.getLogger(__name__)


class BenchmarkDatabase:
    def __init__(self) -> None:
        self.cpu_gaming: Dict[str, Dict[str, Any]] = {}
        self.cpu_software: Dict[str, Dict[str, Any]] = {}
        self.gpu: Dict[str, Dict[str, Any]] = {}
        self.cpu_gaming_title: Optional[str] = None
        self.cpu_software_title: Optional[str] = None
        self.gpu_title: Optional[str] = None
        self.cpu_gaming_index: Dict[str, str] = {}
        self.cpu_software_index: Dict[str, str] = {}
        self.gpu_index: Dict[str, str] = {}
        self.cpu_gaming_compact_index: Dict[str, str] = {}
        self.cpu_software_compact_index: Dict[str, str] = {}
        self.gpu_compact_index: Dict[str, str] = {}
        self.last_benchmark_dir: Optional[str] = None
        self.last_benchmark_paths: List[str] = []
        self._loaded = False

    def _resolve_benchmark_dir(self, benchmarks_dir: str) -> Optional[Path]:
        candidates = [
            Path(benchmarks_dir),
            Path(__file__).resolve().parents[1] / "BalancePrice",
            Path.cwd() / "sam" / "BalancePrice",
            Path.cwd() / "BalancePrice",
        ]
        self.last_benchmark_paths = [str(p) for p in candidates]
        for candidate in candidates:
            if self._has_any_benchmarks(candidate):
                self.last_benchmark_dir = str(candidate)
                return candidate

        search_roots = [
            Path.cwd(),
            Path(__file__).resolve().parents[2],
        ]
        for root in search_roots:
            found = self._find_benchmark_dir(root, max_depth=4)
            if found:
                self.last_benchmark_dir = str(found)
                return found

        self.last_benchmark_dir = None
        return None

    def _has_any_benchmarks(self, candidate: Path) -> bool:
        return any((candidate / name).exists() for name in ("cpu1.json", "cpu2.json", "gpu.json"))

    def _find_benchmark_dir(self, root: Path, max_depth: int = 4) -> Optional[Path]:
        if not root.exists():
            return None
        root = root.resolve()
        for path in root.rglob("cpu1.json"):
            try:
                rel = path.resolve().relative_to(root)
            except Exception:
                continue
            depth = len(rel.parts)
            if depth > max_depth:
                continue
            candidate = path.parent
            if self._has_any_benchmarks(candidate):
                self.last_benchmark_paths.append(str(candidate))
                return candidate
        return None

    def load_benchmarks(self, benchmarks_dir: str = "./sam/BalancePrice") -> None:
        if self._loaded:
            return

        try:
            base_dir = self._resolve_benchmark_dir(benchmarks_dir)
            if not base_dir:
                log.error("Benchmark directory not found. Tried: %s", ", ".join(self.last_benchmark_paths))
                self._loaded = True
                return

            cpu1_path = base_dir / "cpu1.json"
            if cpu1_path.exists():
                with cpu1_path.open("r", encoding="utf-8") as f:
                    data = json.load(f)
                self.cpu_gaming_title = data.get("benchmark_title")
                for cpu in data.get("cpus", []):
                    name = (cpu.get("name") or "").strip()
                    if name:
                        self.cpu_gaming[name] = {
                            "rating": cpu.get("rating"),
                            "relative_performance": cpu.get("relative_performance_percent"),
                            "rank": cpu.get("rank"),
                            "outdated": cpu.get("outdated", False),
                        }
                log.info("Loaded %s CPU gaming benchmarks", len(self.cpu_gaming))

            cpu2_path = base_dir / "cpu2.json"
            if cpu2_path.exists():
                with cpu2_path.open("r", encoding="utf-8") as f:
                    data = json.load(f)
                self.cpu_software_title = data.get("benchmark_name")
                for cpu in data.get("processors", []):
                    name = (cpu.get("name") or "").strip()
                    if name:
                        self.cpu_software[name] = {
                            "rating": cpu.get("rating"),
                            "percentage": cpu.get("percentage"),
                            "rank": cpu.get("rank"),
                            "outdated": cpu.get("outdated", False),
                        }
                log.info("Loaded %s CPU software benchmarks", len(self.cpu_software))

            gpu_path = base_dir / "gpu.json"
            if gpu_path.exists():
                with gpu_path.open("r", encoding="utf-8") as f:
                    data = json.load(f)
                self.gpu_title = data.get("benchmark_title") or "GPU Benchmark Rankings"
                for gpu in data.get("GPU Benchmark Rankings", []):
                    name = (gpu.get("name") or "").strip()
                    if name:
                        self.gpu[name] = {
                            "benchmark_score": gpu.get("benchmark_score"),
                            "relative_performance": gpu.get("relative_performance"),
                            "rank": gpu.get("rank"),
                            "status": gpu.get("status", "current"),
                        }
                log.info("Loaded %s GPU benchmarks", len(self.gpu))

            self._loaded = True
            self._build_indexes()
            log.info("Benchmark database loaded successfully")
        except Exception as e:
            log.error("Error loading benchmarks: %s", e, exc_info=True)
            raise

    def _build_indexes(self) -> None:
        self.cpu_gaming_index = {self._normalize_name(name): name for name in self.cpu_gaming.keys()}
        self.cpu_software_index = {self._normalize_name(name): name for name in self.cpu_software.keys()}
        self.gpu_index = {self._normalize_name(name): name for name in self.gpu.keys()}
        self.cpu_gaming_compact_index = {self._compact_name(name): name for name in self.cpu_gaming.keys()}
        self.cpu_software_compact_index = {self._compact_name(name): name for name in self.cpu_software.keys()}
        self.gpu_compact_index = {self._compact_name(name): name for name in self.gpu.keys()}

    def _normalize_name(self, name: str) -> str:
        name = " ".join(name.split()).lower()
        name = name.replace("amd ", "").replace("intel ", "")
        name = name.replace("geforce ", "").replace("radeon ", "")
        name = re.sub(r"[^\w\s]", " ", name)
        name = " ".join(name.split())
        return name

    def _compact_name(self, name: str) -> str:
        return self._normalize_name(name).replace(" ", "")

    def lookup_cpu_gaming(self, cpu_name: str) -> Optional[Dict[str, Any]]:
        normalized_query = self._normalize_name(cpu_name)
        compact_query = self._compact_name(cpu_name)
        exact_name = self.cpu_gaming_index.get(normalized_query)
        if exact_name:
            return self.cpu_gaming.get(exact_name)
        exact_compact = self.cpu_gaming_compact_index.get(compact_query)
        if exact_compact:
            return self.cpu_gaming.get(exact_compact)
        for name, data in self.cpu_gaming.items():
            normalized_name = self._normalize_name(name)
            if self._tokens_match(normalized_query, normalized_name):
                return data
            if compact_query and compact_query in self._compact_name(name):
                return data
        return None

    def lookup_cpu_software(self, cpu_name: str) -> Optional[Dict[str, Any]]:
        normalized_query = self._normalize_name(cpu_name)
        compact_query = self._compact_name(cpu_name)
        exact_name = self.cpu_software_index.get(normalized_query)
        if exact_name:
            return self.cpu_software.get(exact_name)
        exact_compact = self.cpu_software_compact_index.get(compact_query)
        if exact_compact:
            return self.cpu_software.get(exact_compact)
        for name, data in self.cpu_software.items():
            normalized_name = self._normalize_name(name)
            if self._tokens_match(normalized_query, normalized_name):
                return data
            if compact_query and compact_query in self._compact_name(name):
                return data
        return None

    def lookup_gpu(self, gpu_name: str) -> Optional[Dict[str, Any]]:
        normalized_query = self._normalize_name(gpu_name)
        compact_query = self._compact_name(gpu_name)
        exact_name = self.gpu_index.get(normalized_query)
        if exact_name:
            return self.gpu.get(exact_name)
        exact_compact = self.gpu_compact_index.get(compact_query)
        if exact_compact:
            return self.gpu.get(exact_compact)
        for name, data in self.gpu.items():
            normalized_name = self._normalize_name(name)
            if self._tokens_match(normalized_query, normalized_name):
                return data
            if compact_query and compact_query in self._compact_name(name):
                return data
        return None

    def _tokens_match(self, query: str, candidate: str) -> bool:
        query_tokens = query.split()
        candidate_tokens = candidate.split()
        if not query_tokens or not candidate_tokens:
            return False
        return all(token in candidate_tokens for token in query_tokens) or all(token in query_tokens for token in candidate_tokens)


_benchmark_db = BenchmarkDatabase()


async def lookup_benchmark(
    part: str,
    category: str = "",
    benchmark_type: str = "gaming",
    tool_config: Optional[Dict[str, Any]] = None,
    tool_context: Optional[Any] = None,
) -> Dict[str, Any]:
    log_id = f"[BalancePrice:lookup:{part}]"

    if not _benchmark_db._loaded:
        try:
            benchmarks_dir = tool_config.get("benchmark_source", "./sam/BalancePrice") if tool_config else "./sam/BalancePrice"
            _benchmark_db.load_benchmarks(benchmarks_dir)
        except Exception as e:
            log.error("%s Failed to load benchmarks: %s", log_id, e, exc_info=True)
            return {"status": "error", "message": f"Failed to load benchmarks: {e}"}
    if not _benchmark_db.cpu_gaming and not _benchmark_db.cpu_software and not _benchmark_db.gpu:
        tried = ", ".join(_benchmark_db.last_benchmark_paths) if _benchmark_db.last_benchmark_paths else "unknown"
        return {"status": "error", "message": f"Benchmark files are empty or not loaded. Tried: {tried}"}

    if not category:
        part_lower = part.lower()
        if any(keyword in part_lower for keyword in ["ryzen", "core i", "xeon", "threadripper", "athlon"]):
            category = "cpu"
        elif any(keyword in part_lower for keyword in ["rtx", "gtx", "radeon", "geforce", "arc", "ti", "rx"]):
            category = "gpu"
        else:
            category = "cpu"

    benchmark_data = None
    if category.lower() == "cpu":
        if benchmark_type.lower() == "software":
            benchmark_data = _benchmark_db.lookup_cpu_software(part)
            bench_type_name = "software"
        else:
            benchmark_data = _benchmark_db.lookup_cpu_gaming(part)
            bench_type_name = "gaming"
    elif category.lower() == "gpu":
        benchmark_data = _benchmark_db.lookup_gpu(part)
        bench_type_name = "gaming"
    else:
        return {"status": "error", "message": f"Unknown category: {category}"}

    if not benchmark_data:
        log.warning("%s No benchmark found for %s (normalized=%s)", log_id, part, _benchmark_db._normalize_name(part))
        return {
            "status": "error",
            "message": f"No benchmark found for {part} ({category}, {bench_type_name})",
        }

    if category == "cpu":
        if benchmark_type.lower() == "software":
            score = benchmark_data.get("rating")
            relative_score = benchmark_data.get("percentage")
            benchmark_title = _benchmark_db.cpu_software_title or "Processor Software Benchmark"
        else:
            score = benchmark_data.get("rating")
            relative_score = benchmark_data.get("relative_performance")
            benchmark_title = _benchmark_db.cpu_gaming_title or "Processor Gaming Benchmark"
    else:
        score = benchmark_data.get("benchmark_score")
        relative_score = benchmark_data.get("relative_performance")
        benchmark_title = _benchmark_db.gpu_title or "GPU Benchmark Rankings"

    rank = benchmark_data.get("rank") if isinstance(benchmark_data.get("rank"), int) else None

    if score is None:
        log.warning("%s Found benchmark but no score for %s", log_id, part)
        return {"status": "error", "message": f"Benchmark found but no score for {part}"}

    log.info("%s Found %s %s benchmark: score=%s, relative=%s", log_id, category, bench_type_name, score, relative_score)
    return {
        "status": "success",
        "score": score,
        "relative_score": relative_score,
        "benchmark_title": benchmark_title,
        "benchmark_rank": rank,
        "category": category,
        "benchmark_type": bench_type_name,
        "details": benchmark_data,
    }


async def compute_balance(
    parts: List[Dict[str, Any]],
    benchmark_type: str = "gaming",
    tool_config: Optional[Dict[str, Any]] = None,
    tool_context: Optional[Any] = None,
) -> Dict[str, Any]:
    log_id = "[BalancePrice:compute]"
    if not isinstance(parts, list) or not parts:
        return {"status": "error", "message": "Missing parts array"}

    if not _benchmark_db._loaded:
        try:
            benchmarks_dir = tool_config.get("benchmark_source", "./sam/BalancePrice") if tool_config else "./sam/BalancePrice"
            _benchmark_db.load_benchmarks(benchmarks_dir)
        except Exception as e:
            log.error("%s Failed to load benchmarks: %s", log_id, e, exc_info=True)
            return {"status": "error", "message": f"Failed to load benchmarks: {e}"}

    results: List[Dict[str, Any]] = []
    for entry in parts:
        part_name = entry.get("part")
        price = entry.get("price")

        if not part_name:
            log.warning("%s skipping entry without part name: %s", log_id, entry)
            continue

        if not isinstance(price, (int, float)) or price <= 0:
            log.warning("%s skipping %s with invalid price: %s", log_id, part_name, price)
            results.append({
                "part": part_name,
                "price": price,
                "benchmark": None,
                "relative_performance": None,
                "balance_score": None,
                "category": None,
                "error": f"Invalid price: {price}",
            })
            continue

        bench_result = await lookup_benchmark(part_name, benchmark_type=benchmark_type, tool_config=tool_config)
        if bench_result.get("status") != "success":
            error_msg = bench_result.get("message", "Unknown error")
            log.warning("%s No benchmark for %s: %s", log_id, part_name, error_msg)
            results.append({
                "part": part_name,
                "price": price,
                "benchmark": None,
                "relative_performance": None,
                "balance_score": None,
                "category": bench_result.get("category"),
                "error": error_msg,
            })
            continue

        bench_score = bench_result.get("score")
        relative_score = bench_result.get("relative_score")
        category = bench_result.get("category", "unknown")
        benchmark_title = bench_result.get("benchmark_title")
        benchmark_rank = bench_result.get("benchmark_rank")

        if not isinstance(benchmark_rank, int) or benchmark_rank <= 0:
            balance_score = None
            error_msg = f"Invalid benchmark rank: {benchmark_rank}"
        elif price <= 0:
            balance_score = None
            error_msg = f"Invalid price: {price}"
        else:
            balance_score = benchmark_rank / price
            error_msg = None

        if bench_score is None or bench_score <= 0:
            bench_score = None

        results.append({
            "part": part_name,
            "price": float(price),
            "benchmark": float(bench_score) if bench_score else None,
            "relative_performance": float(relative_score) if relative_score else None,
            "balance_score": float(balance_score) if balance_score else None,
            "category": category,
            "benchmark_type": benchmark_type,
            "benchmark_title": benchmark_title,
            "benchmark_rank": benchmark_rank,
            "error": error_msg,
        })

    valid_results = [r for r in results if r["balance_score"] is not None]
    invalid_results = [r for r in results if r["balance_score"] is None]
    valid_results.sort(key=lambda r: r["balance_score"], reverse=True)

    for i, r in enumerate(valid_results, start=1):
        r["rank"] = i

    all_results = valid_results + invalid_results
    log.info("%s Evaluated %s valid and %s invalid parts", log_id, len(valid_results), len(invalid_results))
    return {
        "status": "success",
        "valid_count": len(valid_results),
        "invalid_count": len(invalid_results),
        "benchmark_type": benchmark_type,
        "evaluated": all_results,
    }


async def get_top_performers(
    category: str = "cpu",
    benchmark_type: str = "gaming",
    limit: int = 10,
    tool_config: Optional[Dict[str, Any]] = None,
    tool_context: Optional[Any] = None,
) -> Dict[str, Any]:
    log_id = f"[BalancePrice:top:{category}]"

    if not _benchmark_db._loaded:
        try:
            benchmarks_dir = tool_config.get("benchmark_source", "./sam/BalancePrice") if tool_config else "./sam/BalancePrice"
            _benchmark_db.load_benchmarks(benchmarks_dir)
        except Exception as e:
            log.error("%s Failed to load benchmarks: %s", log_id, e, exc_info=True)
            return {"status": "error", "message": f"Failed to load benchmarks: {e}"}

    top_parts: List[Dict[str, Any]] = []

    if category.lower() == "cpu":
        if benchmark_type.lower() == "software":
            source_data = _benchmark_db.cpu_software
            title = _benchmark_db.cpu_software_title or "Processor Software Benchmark"
        else:
            source_data = _benchmark_db.cpu_gaming
            title = _benchmark_db.cpu_gaming_title or "Processor Gaming Benchmark"

        sorted_items = sorted(
            [(name, data) for name, data in source_data.items() if isinstance(data.get("rank"), int)],
            key=lambda x: x[1].get("rank", -1),
            reverse=True,
        )[:limit]

        for name, data in sorted_items:
            top_parts.append({
                "name": name,
                "score": data.get("rating"),
                "relative_performance": data.get("relative_performance") or data.get("percentage"),
                "rank": data.get("rank"),
            })

    elif category.lower() == "gpu":
        source_data = _benchmark_db.gpu
        title = _benchmark_db.gpu_title or "GPU Benchmark Rankings"
        sorted_items = sorted(
            [(name, data) for name, data in source_data.items() if isinstance(data.get("rank"), int)],
            key=lambda x: x[1].get("rank", -1),
            reverse=True,
        )[:limit]

        for name, data in sorted_items:
            top_parts.append({
                "name": name,
                "score": data.get("benchmark_score"),
                "relative_performance": data.get("relative_performance"),
                "rank": data.get("rank"),
            })
    else:
        return {"status": "error", "message": f"Unknown category: {category}"}

    return {
        "status": "success",
        "category": category,
        "benchmark_type": benchmark_type,
        "benchmark_title": title,
        "top_performers": top_parts,
    }


async def select_best_part(
    category: str,
    benchmark_type: str = "gaming",
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    prices: Optional[List[Dict[str, Any]]] = None,
    tool_config: Optional[Dict[str, Any]] = None,
    tool_context: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Pick the highest-ranked part within a price range using benchmark data and prices.

    Args:
        category: "cpu" or "gpu"
        benchmark_type: For CPUs - "gaming" or "software"
        min_price: Minimum allowed price (inclusive)
        max_price: Maximum allowed price (inclusive)
        prices: List of {"part": name, "price": number} from PriceTracking results
    """
    log_id = f"[BalancePrice:select:{category}]"
    if not _benchmark_db._loaded:
        try:
            benchmarks_dir = tool_config.get("benchmark_source", "./sam/BalancePrice") if tool_config else "./sam/BalancePrice"
            _benchmark_db.load_benchmarks(benchmarks_dir)
        except Exception as e:
            log.error("%s Failed to load benchmarks: %s", log_id, e, exc_info=True)
            return {"status": "error", "message": f"Failed to load benchmarks: {e}"}

    if not prices:
        return {"status": "error", "message": "Missing prices list from PriceTracking results."}

    price_map: Dict[str, float] = {}
    for item in prices:
        name = (item.get("part") or "").strip()
        price = item.get("price")
        if not name or not isinstance(price, (int, float)):
            continue
        existing = price_map.get(name)
        if existing is None or price < existing:
            price_map[name] = float(price)

    if not price_map:
        return {"status": "error", "message": "No valid prices provided."}

    if category.lower() == "cpu":
        if benchmark_type.lower() == "software":
            source_data = _benchmark_db.cpu_software
            title = _benchmark_db.cpu_software_title or "Processor Software Benchmark"
        else:
            source_data = _benchmark_db.cpu_gaming
            title = _benchmark_db.cpu_gaming_title or "Processor Gaming Benchmark"
    elif category.lower() == "gpu":
        source_data = _benchmark_db.gpu
        title = _benchmark_db.gpu_title or "GPU Benchmark Rankings"
    else:
        return {"status": "error", "message": f"Unknown category: {category}"}

    ranked = sorted(
        [(name, data) for name, data in source_data.items() if isinstance(data.get("rank"), int)],
        key=lambda x: x[1].get("rank", -1),
        reverse=True,
    )

    for name, data in ranked:
        price = price_map.get(name)
        if price is None:
            continue
        if min_price is not None and price < min_price:
            continue
        if max_price is not None and price > max_price:
            continue
        result = {
            "status": "success",
            "part": name,
            "price": price,
            "benchmark_title": title,
            "benchmark_rank": data.get("rank"),
            "category": category,
            "benchmark_type": benchmark_type,
        }
        return result

    return {"status": "error", "message": "No parts found within the given price range."}
