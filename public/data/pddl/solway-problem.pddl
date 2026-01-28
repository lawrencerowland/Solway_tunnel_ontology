(define (problem solway-tunnel-construction)
  (:domain tunnel-construction)

  (:objects
    north_site south_site - site
    tbm1 - tbm
    seg_entry seg1 seg2 seg3 seg_exit - segment
  )

  (:init
    (not (site_prepared north_site)) (not (site_prepared south_site))
    (site_at north_site seg_entry) (site_at south_site seg_exit)
    (tbm_available tbm1)
    (segment_connected seg_entry seg1) (segment_connected seg1 seg2)
    (segment_connected seg2 seg3) (segment_connected seg3 seg_exit)
    (not (segment_excavated seg_entry)) (not (segment_lined seg_entry))
    (not (segment_excavated seg1)) (not (segment_lined seg1))
    (not (segment_excavated seg2)) (not (segment_lined seg2))
    (not (segment_excavated seg3)) (not (segment_lined seg3))
    (not (segment_excavated seg_exit)) (not (segment_lined seg_exit))
    (not (tunnel_complete))
  )

  (:goal
    (and
        (site_prepared north_site) (site_prepared south_site)
        (tbm_received tbm1 south_site)
        (segment_excavated seg1) (segment_lined seg1)
        (segment_excavated seg2) (segment_lined seg2)
        (segment_excavated seg3) (segment_lined seg3)
    )
  )
)
