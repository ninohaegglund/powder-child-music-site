<?php
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style(
        'child-style',
        get_stylesheet_uri(),
        [],
        wp_get_theme()->get('Version')
    );

  wp_enqueue_script(
    'artist-filters',
    get_stylesheet_directory_uri() . '/artist-filters.js',
    [],
    wp_get_theme()->get('Version'),
    true
  );
});


/**
 * Plugin Name: Artist Search Helpers
 * Description: Shortcodes for taxonomy filters and results.
 * Version: 0.3.1
 */
if (!defined('ABSPATH')) { exit; }

/* ===== Terms UI (links/checkboxes) ===== */
add_shortcode('artist_terms', function($atts){
  $a = shortcode_atts([
    'taxonomy'   => 'genre',       // genre | city | instrument | performance_type | musician_type | service
    'display'    => 'dropdown',    // links | checkboxes | dropdown | disclosure
    'orderby'    => 'name',
    'order'      => 'ASC',
    'hide_empty' => '0',
    'param'      => '',            // query param name; defaults to taxonomy slug
    'title'      => '',
    'placeholder'=> '',            // label shown for dropdown/disclosure when title is not used
    'link_to'    => 'search',      // search | archive
  ], $atts, 'artist_terms');

  $tax = sanitize_key($a['taxonomy']);
  if (!taxonomy_exists($tax)) return '';

  $param = $a['param'] ? sanitize_key($a['param']) : $tax;

  $terms = get_terms([
    'taxonomy'   => $tax,
    'hide_empty' => $a['hide_empty'] === '1',
    'orderby'    => $a['orderby'],
    'order'      => $a['order'],
  ]);
  if (is_wp_error($terms) || empty($terms)) return '';

  // currently selected values from URL
  $selected = [];
  if (!empty($_GET[$param])) {
    $v = $_GET[$param];
    $selected = is_array($v)
      ? array_map('sanitize_title', $v)
      : array_map('sanitize_title', array_filter(array_map('trim', explode(',', $v))));
  }

  ob_start();
  if ($a['title']) echo '<h3>'.esc_html($a['title']).'</h3>';

  if ($a['display'] === 'links') {
    echo '<ul class="artist-terms artist-terms--links">';
    foreach ($terms as $t) {
      $active = in_array($t->slug, $selected, true);

      // toggle this term while preserving other query params
      $params = $_GET;
      unset($params['page']); // reset pagination on filter change
      $new = $selected;

      if ($active) {
        $new = array_values(array_diff($new, [$t->slug]));
      } else {
        $new[] = $t->slug;
      }

      if ($new) {
        $params[$param] = implode(',', $new);
      } else {
        unset($params[$param]);
      }

      $url = esc_url(add_query_arg($params, get_permalink()));
      echo '<li><a class="'.($active?'is-active':'').'" href="'.$url.'">'.esc_html($t->name).'</a></li>';
    }
    echo '</ul>';
  } elseif ($a['display'] === 'dropdown') {
    $selected_value = $selected[0] ?? '';

    echo '<form class="artist-terms artist-terms--dropdown" method="get" action="">';
    // keep other params
    foreach ($_GET as $k => $v) {
      if ($k === 'page' || $k === $param) continue;
      if (is_array($v)) {
        foreach ($v as $vv) echo '<input type="hidden" name="'.esc_attr($k).'[]" value="'.esc_attr($vv).'">';
      } else {
        echo '<input type="hidden" name="'.esc_attr($k).'" value="'.esc_attr($v).'">';
      }
    }

    echo '<fieldset><legend>'.esc_html(ucwords(str_replace('_',' ',$tax))).'</legend>';
    echo '<select name="'.esc_attr($param).'">';
    echo '<option value="">Alla</option>';
    foreach ($terms as $t) {
      $is_selected = ($t->slug === $selected_value) ? 'selected' : '';
      echo '<option value="'.esc_attr($t->slug).'" '.$is_selected.'>'.esc_html($t->name).'</option>';
    }
    echo '</select>';
    echo '</fieldset>';
    echo '<button class="artist-terms__apply" type="submit">Tillämpa</button>';
    echo '</form>';
  } elseif ($a['display'] === 'disclosure') {
    // dropdown-like UI that reveals checkboxes (multi-select) without JS
    $selected_count = is_array($selected) ? count($selected) : 0;
    $label = $a['placeholder'] !== ''
      ? sanitize_text_field($a['placeholder'])
      : ucwords(str_replace('_',' ',$tax));
    $summary = $selected_count > 0 ? ($label.' ('.$selected_count.')') : $label;

    echo '<form class="artist-terms artist-terms--disclosure" method="get" action="">';
    // keep other params
    foreach ($_GET as $k => $v) {
      if ($k === 'page' || $k === $param) continue;
      if (is_array($v)) {
        foreach ($v as $vv) echo '<input type="hidden" name="'.esc_attr($k).'[]" value="'.esc_attr($vv).'">';
      } else {
        echo '<input type="hidden" name="'.esc_attr($k).'" value="'.esc_attr($v).'">';
      }
    }

    echo '<details>';
    echo '<summary>'.esc_html($summary).'</summary>';
    echo '<div class="artist-terms__panel">';
    echo '<div class="artist-terms__options">';
    foreach ($terms as $t) {
      $checked = in_array($t->slug, $selected, true) ? 'checked' : '';
      echo '<label class="artist-terms__option">';
      echo '<input type="checkbox" name="'.esc_attr($param).'[]" value="'.esc_attr($t->slug).'" '.$checked.'> ';
      echo esc_html($t->name);
      echo '</label>';
    }
    echo '</div>';
    echo '<button class="artist-terms__apply" type="submit">Tillämpa</button>';
    echo '</div>';
    echo '</details>';
    echo '</form>';
  } else {
    // checkbox form
    echo '<form class="artist-terms artist-terms--checkboxes" method="get" action="">';
    // keep other params
    foreach ($_GET as $k => $v) {
      if ($k === 'page' || $k === $param) continue;
      if (is_array($v)) {
        foreach ($v as $vv) echo '<input type="hidden" name="'.esc_attr($k).'[]" value="'.esc_attr($vv).'">';
      } else {
        echo '<input type="hidden" name="'.esc_attr($k).'" value="'.esc_attr($v).'">';
      }
    }
    echo '<fieldset><legend>'.esc_html(ucwords(str_replace('_',' ',$tax))).'</legend>';
    foreach ($terms as $t) {
      $checked = in_array($t->slug, $selected, true) ? 'checked' : '';
      echo '<label style="display:block;margin:.25rem 0">';
      echo '<input type="checkbox" name="'.esc_attr($param).'[]" value="'.esc_attr($t->slug).'" '.$checked.'> '.esc_html($t->name);
      echo '</label>';
    }
    echo '</fieldset>';
    echo '<button class="artist-terms__apply" type="submit">Tillämpa</button>';
    echo '</form>';
  }

  return ob_get_clean();
});

/* ===== Includes equipment toggle ===== */
add_shortcode('artist_includes_equipment', function($atts){
  $a = shortcode_atts([
  'param' => 'includes_equipment',   // prefer snake_case to match meta key
  'title' => 'Med utrustning',
], $atts, 'artist_includes_equipment');

  $param = sanitize_key($a['param']);
  $isOn = false;
  if (!empty($_GET[$param])) {
    $val = strtolower((string)$_GET[$param]);
    $isOn = in_array($val, ['1','true','yes','on'], true);
  }

  // Build toggle URL link (no extra form needed)
  $params = $_GET;
  unset($params['page']); // reset pagination
  if ($isOn) {
    unset($params[$param]);
  } else {
    $params[$param] = 'true';
  }
  $url = esc_url(add_query_arg($params, get_permalink()));

  ob_start();
  echo '<div class="artist-flag artist-flag--equipment">';
  echo '<strong>'.esc_html($a['title']).':</strong> ';
  echo '<a class="'.($isOn?'is-active':'').'" href="'.$url.'">'.($isOn ? 'Ja' : 'Nej').'</a>';
  echo '</div>';
  return ob_get_clean();
});

/* ===== Results shortcode: lists all artists when no filters ===== */
add_shortcode('artist_search_results', function($atts){
  $a = shortcode_atts([
    'post_type' => 'artist',  
    
    'limit'     => '15',
  ], $atts, 'artist_search_results');

  $post_type = sanitize_key($a['post_type']);
  $limit     = max(1, min((int)$a['limit'], 50));

  $g = function($k,$d=''){ $v=$_GET[$k]??$d; return is_array($v)?array_map('sanitize_text_field',$v):sanitize_text_field($v); };
  $toArr = function($v){ if($v===''||$v===null) return []; return is_array($v)?$v:array_filter(array_map('trim', explode(',', $v))); };

  // Read filters
  $musicianType = $g('musician_type');
  $service      = $g('service');
  $genre        = $g('genre');
  $city         = $g('city');
  $performance  = $g('performance');
  $instrument   = $g('instrument');
  $equipIn = strtolower((string)($g('includesequipment') ?: $g('includes_equipment') ?: $g('includesEquipment')));
  $sorting      = $g('sorting');
  $search       = $g('s');
  $paged        = max(1, (int)$g('page', 1));

  // Build tax_query
  $tax_query = ['relation'=>'AND'];
  if ($arr=$toArr($musicianType)) { $arr=array_map('sanitize_title',$arr); $tax_query[]=['taxonomy'=>'musician_type','field'=>'slug','terms'=>$arr,'operator'=>(count($arr)>1?'AND':'IN')]; }
  if ($arr=$toArr($service))      { $arr=array_map('sanitize_title',$arr); $tax_query[]=['taxonomy'=>'service','field'=>'slug','terms'=>$arr,'operator'=>(count($arr)>1?'AND':'IN')]; }
  if ($arr=$toArr($genre))        { $arr=array_map('sanitize_title',$arr); $tax_query[]=['taxonomy'=>'genre','field'=>'slug','terms'=>$arr,'operator'=>(count($arr)>1?'AND':'IN')]; }
  if ($arr=$toArr($city))         { $arr=array_map('sanitize_title',$arr); $tax_query[]=['taxonomy'=>'city','field'=>'slug','terms'=>$arr,'operator'=>(count($arr)>1?'AND':'IN')]; }
  if ($arr=$toArr($performance))  { $arr=array_map('sanitize_title',$arr); $tax_query[]=['taxonomy'=>'performance_type','field'=>'slug','terms'=>$arr,'operator'=>(count($arr)>1?'AND':'IN')]; }
  if ($arr=$toArr($instrument))   { $arr=array_map('sanitize_title',$arr); $tax_query[]=['taxonomy'=>'instrument','field'=>'slug','terms'=>$arr,'operator'=>(count($arr)>1?'AND':'IN')]; }

  // Meta (includes_equipment)
  $meta_query = [];
  if (in_array($equipIn,['1','true','yes','on'],true)) {
    $meta_query[]=['key'=>'includes_equipment','value'=>'1','compare'=>'='];
  }

  // Sorting
  $orderby='date'; $order='DESC'; $meta_key=null;
  if ($sorting) {
    [$key,$dir]=array_pad(explode(':', strtolower($sorting), 2), 2, 'desc');
    $order = $dir==='asc'?'ASC':'DESC';
    switch ($key) {
      case 'relevancy': case 'relevance': $orderby = !empty($search)?'relevance':'date'; break;
      case 'price': $orderby='meta_value_num'; $meta_key='price'; break;
      case 'title': $orderby='title'; break;
      default: $orderby='date';
    }
  }

  $args = [
    'post_type'      => $post_type,
    'posts_per_page' => $limit,
    'paged'          => $paged,
    's'              => $search,
    'orderby'        => $orderby,
    'order'          => $order,
  ];
  if (count($tax_query) > 1) { $args['tax_query'] = $tax_query; }
  if ($meta_query) { $args['meta_query'] = $meta_query; }
  if ($meta_key)   { $args['meta_key']   = $meta_key; }

  $q = new WP_Query($args);

  ob_start();
  echo '<section class="results">';
  if ($q->have_posts()){
    echo '<ul class="artist-list">';
    while ($q->have_posts()){ $q->the_post();
      $price = get_post_meta(get_the_ID(),'price',true);
      $service_terms = get_the_terms(get_the_ID(), 'service');
      $service_label = '';
      if (!is_wp_error($service_terms) && !empty($service_terms)) {
        $first = reset($service_terms);
        if ($first && !empty($first->name)) {
          $service_label = (string) $first->name;
        }
      }
      echo '<li class="artist-card"><a href="'.esc_url(get_permalink()).'">';
      if (has_post_thumbnail()) the_post_thumbnail('medium');
      if ($service_label !== '') echo '<p class="artist-service">'.esc_html($service_label).'</p>';
      echo '<h3>'.esc_html(get_the_title()).'</h3>';
      if ($price!=='') echo '<p class="artist-price">Från '.esc_html(number_format((float)$price,0,',',' ')).' SEK</p>';
      echo '</a></li>';
    }
    echo '</ul>';

    echo paginate_links([
      'base'    => add_query_arg('page','%#%'),
      'format'  => '',
      'current' => $paged,
      'total'   => max(1,(int)$q->max_num_pages),
      'prev_text'=>'Previous',
      'next_text'=>'Next',
    ]);
  } else {
    echo '<p class="search-results-text">Inga sökresultat</p>';
  }
  echo '</section>';
  wp_reset_postdata();
  return ob_get_clean();
});