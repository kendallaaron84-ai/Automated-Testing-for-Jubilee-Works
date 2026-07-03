<?php
/**
 * Jubilee Works: Sovereign Dynamic Library Engine
 */
if ( ! defined( 'ABSPATH' ) ) exit;

function koba_window_shortcode() {
    // 1. SAFETY GATE: If inside the WordPress admin editor backend, return a clean placeholder
    if (is_admin() || (defined('REST_REQUEST') && REST_REQUEST)) {
        return '<div style="padding: 15px; border: 1px dashed #cbd5e1; color: #64748b; text-align: center;">⚙️ Jubilee Library Carousel View Window [koba_window]</div>';
    }

    // 2. LICENSE VALIDATION LOCK
    if (get_option('koba_license_status') !== 'active') {
        return '<div style="padding: 20px; background: #fee2e2; color: #991b1b; text-align: center;"><strong>Jubilee Studio Error:</strong> License not activated.</div>';
    }

    $current_user = wp_get_current_user();
    $email = is_user_logged_in() ? $current_user->user_email : '';

    // Enqueue the production accessibility assets
    wp_enqueue_style('koba-bloom-css', KOBA_IA_URL . 'assets/bloom-style.css', [], '3.8.0');
    wp_enqueue_script('jubilee-core-js', KOBA_IA_URL . 'assets/jubilee-core.js', [], '1.0.0', true);

    // Output the data capture variables purely to the live public-facing wrapper
    $output = '<script>window.currentJubileeUserEmail = "' . esc_js($email) . '";</script>';
    $output .= '<div id="jubilee-bloom-root" style="min-height: 500px; width: 100%; margin-top:20px;">';
    $output .= '    <div style="color: #94a3b8; text-align:center; padding:50px;">Connecting to Jubilee Command Center...</div>';
    $output .= '</div>';

    return $output;
}
add_shortcode('koba_window', 'koba_window_shortcode');