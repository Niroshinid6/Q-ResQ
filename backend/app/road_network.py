import networkx as nx
from typing import List, Dict
from app.models import RoadNetworkDetails, NetworkNodeInfo, RoadEdgeInfo

# Synthetic 2D spatial layout of the 10 nodes for map visualization
NODE_COORDINATES: Dict[str, tuple[float, float]] = {
    "N1": (80.0, 80.0),
    "N2": (220.0, 70.0),
    "N3": (100.0, 220.0),
    "N4": (380.0, 80.0),
    "N5": (230.0, 210.0),
    "N6": (120.0, 360.0),
    "N7": (390.0, 220.0),
    "N8": (250.0, 360.0),
    "N9": (180.0, 460.0),
    "N10": (380.0, 420.0),
}

DEFAULT_EDGES = [
    ("N1", "N2", 2.0),
    ("N1", "N3", 3.0),
    ("N2", "N4", 4.0),
    ("N2", "N5", 2.0),
    ("N3", "N5", 3.0),
    ("N3", "N6", 5.0),
    ("N4", "N7", 3.0),
    ("N5", "N7", 4.0),
    ("N5", "N8", 3.0),
    ("N6", "N8", 2.0),
    ("N6", "N9", 4.0),
    ("N7", "N10", 5.0),
    ("N8", "N10", 3.0),
    ("N9", "N10", 2.0),
]


def build_network() -> nx.DiGraph:
    """Build directed graph with distance and travel time."""
    graph = nx.DiGraph()
    for u, v, d in DEFAULT_EDGES:
        # 60 km/h baseline -> 1 km = 1 minute
        t = (d / 60.0) * 60.0
        graph.add_edge(u, v, distance_km=d, travel_time_min=t, baseline_travel_time_min=t)
        graph.add_edge(v, u, distance_km=d, travel_time_min=t, baseline_travel_time_min=t)
    return graph


def get_travel_time(graph: nx.DiGraph, from_node: str, to_node: str) -> float:
    try:
        length = nx.shortest_path_length(
            graph, source=from_node, target=to_node, weight="travel_time_min"
        )
        return float(length)
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        raise ValueError(f"No path between {from_node} and {to_node}")


def apply_traffic_update(
    graph: nx.DiGraph, from_node: str, to_node: str, new_travel_time_minutes: float
) -> None:
    if graph.has_edge(from_node, to_node):
        graph[from_node][to_node]["travel_time_min"] = new_travel_time_minutes


def list_nodes(graph: nx.DiGraph) -> List[str]:
    return sorted(list(graph.nodes()))


def get_network_details(graph: nx.DiGraph) -> RoadNetworkDetails:
    """Export nodes with spatial coordinates and directed edges with congestion flags."""
    nodes_info = [
        NetworkNodeInfo(
            id=node,
            x=NODE_COORDINATES.get(node, (100.0, 100.0))[0],
            y=NODE_COORDINATES.get(node, (100.0, 100.0))[1],
            label=node,
        )
        for node in list_nodes(graph)
    ]

    edges_info: List[RoadEdgeInfo] = []
    for u, v, data in graph.edges(data=True):
        tt = float(data.get("travel_time_min", 1.0))
        base_tt = float(data.get("baseline_travel_time_min", tt))
        is_congested = tt > (base_tt * 1.25)
        edges_info.append(
            RoadEdgeInfo(
                from_node=u,
                to_node=v,
                distance_km=float(data.get("distance_km", 1.0)),
                travel_time_min=tt,
                baseline_travel_time_min=base_tt,
                is_congested=is_congested,
            )
        )

    return RoadNetworkDetails(nodes=nodes_info, edges=edges_info)
