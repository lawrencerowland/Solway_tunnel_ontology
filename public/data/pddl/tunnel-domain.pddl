(define (domain tunnel-construction)
  (:requirements :strips :typing)

  (:types
    site tbm segment
  )

  (:predicates
    (site_prepared ?s - site)
    (site_at ?s - site ?seg - segment)
    (tbm_available ?m - tbm)
    (tbm_assembled ?m - tbm ?s - site)
    (tbm_launched ?m - tbm ?s - site)
    (tbm_at ?m - tbm ?seg - segment)
    (tbm_received ?m - tbm ?s - site)
    (segment_connected ?seg1 - segment ?seg2 - segment)
    (segment_excavated ?seg - segment)
    (segment_lined ?seg - segment)
    (tunnel_complete)
    (can_excavate_from ?seg - segment)
  )

  (:action prepare_site
    :parameters (?s - site)
    :precondition (not (site_prepared ?s))
    :effect (site_prepared ?s)
  )

  (:action assemble_tbm
    :parameters (?m - tbm ?s - site)
    :precondition (and (site_prepared ?s) (tbm_available ?m))
    :effect (and (tbm_assembled ?m ?s) (not (tbm_available ?m)))
  )

  (:action launch_tbm
    :parameters (?m - tbm ?s - site ?start_seg - segment)
    :precondition (and (tbm_assembled ?m ?s) (site_at ?s ?start_seg))
    :effect (and (tbm_launched ?m ?s) (tbm_at ?m ?start_seg) (can_excavate_from ?start_seg) (not (tbm_assembled ?m ?s)))
  )

  (:action excavate_and_line_segment
    :parameters (?m - tbm ?from_seg - segment ?to_seg - segment)
    :precondition (and (tbm_at ?m ?from_seg) (can_excavate_from ?from_seg) (segment_connected ?from_seg ?to_seg) (not (segment_excavated ?to_seg)))
    :effect (and (segment_excavated ?to_seg) (segment_lined ?to_seg) (tbm_at ?m ?to_seg) (can_excavate_from ?to_seg) (not (tbm_at ?m ?from_seg)) (not (can_excavate_from ?from_seg)))
  )

  (:action receive_tbm
      :parameters (?m - tbm ?s_dest - site ?final_seg - segment)
      :precondition (and (tbm_at ?m ?final_seg) (site_at ?s_dest ?final_seg) (site_prepared ?s_dest))
      :effect (and (tbm_received ?m ?s_dest) (not (tbm_at ?m ?final_seg)) (not (can_excavate_from ?final_seg)))
  )
)
